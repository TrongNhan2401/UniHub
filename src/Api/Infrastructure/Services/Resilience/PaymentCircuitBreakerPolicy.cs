using Microsoft.Extensions.Logging;
using Polly;

namespace Infrastructure.Services.Resilience
{
    /// <summary>
    /// Circuit Breaker Policy cho Payment Gateway (PayOS).
    /// 
    /// Mục đích:
    /// - Nếu PayOS bị lỗi liên tiếp 5 lần → mở circuit (fail fast)
    /// - Khi circuit mở → trả graceful response thay vì timeout
    /// - Đợi 30s, rồi thử lại → nếu thành công thì đóng circuit
    /// 
    /// Kết quả:
    /// - Sinh viên vẫn xem được workshop bình thường
    /// - Checkout API trả lỗi rõ ràng thay vì timeout
    /// - Giảm tải cho PayOS khi nó đang bị quá tải
    /// </summary>
    public class PaymentCircuitBreakerPolicy
    {
        private enum CircuitBreakerState
        {
            Closed,
            Open,
            HalfOpen
        }

        private CircuitBreakerState _state = CircuitBreakerState.Closed;
        private int _failureCount = 0;
        private DateTime _lastFailureTime = DateTime.MinValue;
        private DateTime _circuitOpenTime = DateTime.MinValue;
        private readonly int _failureThreshold = 5;
        private readonly TimeSpan _durationOfBreak = TimeSpan.FromSeconds(30);
        private readonly object _lockObject = new object();
        private readonly ILogger<PaymentCircuitBreakerPolicy> _logger;

        public PaymentCircuitBreakerPolicy(ILogger<PaymentCircuitBreakerPolicy> logger)
        {
            _logger = logger;
        }

        /// <summary>
        /// Thực thi action với circuit breaker
        /// Nếu circuit mở → throw BrokenCircuitException
        /// </summary>
        public async Task<T> ExecuteAsync<T>(Func<Task<T>> action) where T : class
        {
            lock (_lockObject)
            {
                CheckCircuitStateTransition();
                
                if (_state == CircuitBreakerState.Open)
                {
                    throw new InvalidOperationException(
                        "Circuit breaker is OPEN - Payment gateway temporarily unavailable");
                }
            }

            try
            {
                var result = await action();
                
                lock (_lockObject)
                {
                    // Thành công → reset failure count
                    if (_state == CircuitBreakerState.HalfOpen)
                    {
                        _logger.LogInformation(
                            "[CIRCUIT BREAKER] Payment gateway circuit CLOSED - Payment service recovered");
                        _state = CircuitBreakerState.Closed;
                    }
                    
                    _failureCount = 0;
                    _lastFailureTime = DateTime.MinValue;
                }
                
                return result;
            }
            catch (Exception ex)
            {
                lock (_lockObject)
                {
                    _failureCount++;
                    _lastFailureTime = DateTime.UtcNow;

                    if (_failureCount >= _failureThreshold)
                    {
                        _state = CircuitBreakerState.Open;
                        _circuitOpenTime = DateTime.UtcNow;
                        
                        _logger.LogWarning(
                            "[CIRCUIT BREAKER] Payment gateway circuit OPENED. " +
                            "Failure count: {FailureCount}. Will attempt recovery after {Duration}s. " +
                            "Error: {Error}",
                            _failureCount,
                            _durationOfBreak.TotalSeconds,
                            ex.Message);
                    }
                }
                throw;
            }
        }

        /// <summary>
        /// Thực thi action với fallback value khi circuit mở hoặc lỗi
        /// </summary>
        public async Task<T?> ExecuteAsyncWithFallback<T>(Func<Task<T>> action, T? fallbackValue = null) where T : class
        {
            try
            {
                return await ExecuteAsync(action);
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarning(
                    "[CIRCUIT BREAKER] Circuit is OPEN - Returning graceful fallback. {Message}",
                    ex.Message);
                return fallbackValue;
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    "[CIRCUIT BREAKER] Unexpected error during execution - returning fallback. Error: {Error}",
                    ex.Message);
                return fallbackValue;
            }
        }

        /// <summary>
        /// Kiểm tra và chuyển trạng thái circuit nếu cần
        /// </summary>
        private void CheckCircuitStateTransition()
        {
            if (_state == CircuitBreakerState.Open)
            {
                var timeSinceCircuitOpened = DateTime.UtcNow - _circuitOpenTime;
                
                if (timeSinceCircuitOpened >= _durationOfBreak)
                {
                    _state = CircuitBreakerState.HalfOpen;
                    _failureCount = 0;
                    _logger.LogInformation(
                        "[CIRCUIT BREAKER] Payment gateway circuit HALF-OPEN - Testing if PayOS is back online");
                }
            }
        }
    }
}
