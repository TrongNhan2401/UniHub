import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import StudentShell from "@/components/StudentShell";
import { CheckCircle2, XCircle, Clock, ArrowLeft, Loader2 } from "lucide-react";
import { paymentService } from "@/services/workshopService";

/**
 * PaymentResultPage — landing page sau khi PayOS redirect về.
 *
 * Query params PayOS gửi kèm:
 *   code        "00" = success | "01" = error
 *   status      "PAID" | "CANCELLED" | "PROCESSING"
 *   cancel      "true" nếu user chủ động huỷ
 *   orderCode   mã đơn hàng (số)
 *   id          payment link id
 */
export default function PaymentResultPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const code = searchParams.get("code");
  const status = searchParams.get("status");
  const cancelled = searchParams.get("cancel") === "true";
  const orderCode = searchParams.get("orderCode");
  const workshopIdFromQuery = searchParams.get("workshopId");
  const registrationIdFromQuery = searchParams.get("registrationId");

  const isSuccess = code === "00" && status === "PAID" && !cancelled;
  const isCancelled = cancelled || status === "CANCELLED";

  const [paymentDetail, setPaymentDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [redirectSeconds, setRedirectSeconds] = useState(3);

  // Lưu workshopId vào sessionStorage trước khi redirect sang PayOS
  // để có thể quay lại đúng trang workshop sau khi thanh toán.
  const returnWorkshopId = sessionStorage.getItem("paymentWorkshopId") || workshopIdFromQuery;
  const returnRegistrationId = sessionStorage.getItem("paymentRegistrationId") || registrationIdFromQuery;

  useEffect(() => {
    if (workshopIdFromQuery && !sessionStorage.getItem("paymentWorkshopId")) {
      sessionStorage.setItem("paymentWorkshopId", workshopIdFromQuery);
    }

    if (registrationIdFromQuery && !sessionStorage.getItem("paymentRegistrationId")) {
      sessionStorage.setItem("paymentRegistrationId", registrationIdFromQuery);
    }
  }, [registrationIdFromQuery, workshopIdFromQuery]);

  useEffect(() => {
    if (!isSuccess || !returnRegistrationId) return;

    // Polling nhẹ: thử lấy trạng thái payment từ backend
    // (webhook có thể chưa đến ngay lúc user vừa redirect về)
    let attempts = 0;
    const maxAttempts = 5;
    const pollInterval = 2000; // 2s

    const poll = async () => {
      if (attempts >= maxAttempts) return;
      attempts++;
      setLoadingDetail(true);
      try {
        const res = await paymentService.getByRegistration(returnRegistrationId);
        if (res?.data?.status === "COMPLETED") {
          setPaymentDetail(res.data);
          setLoadingDetail(false);
          // Xoá session storage sau khi done
          sessionStorage.removeItem("paymentWorkshopId");
          sessionStorage.removeItem("paymentRegistrationId");
          return;
        }
        // Chưa có → thử lại
        setTimeout(poll, pollInterval);
      } catch {
        setLoadingDetail(false);
      }
    };

    poll();
  }, [isSuccess, returnRegistrationId]);

  useEffect(() => {
    if (!isSuccess || !paymentDetail || !returnWorkshopId) return;

    setRedirectSeconds(3);
    const interval = setInterval(() => {
      setRedirectSeconds((seconds) => (seconds > 1 ? seconds - 1 : 1));
    }, 1000);

    const timeout = setTimeout(() => {
      navigate(`/workshops/${returnWorkshopId}`, { replace: true });
    }, 3000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [isSuccess, navigate, paymentDetail, returnWorkshopId]);

  return (
    <StudentShell activeTop="Đăng ký của tôi">
      <div className="mx-auto max-w-lg py-16 text-center">
        {isSuccess ? (
          <>
            <CheckCircle2 className="mx-auto mb-4 h-16 w-16 text-green-500" />
            <h1 className="mb-2 text-2xl font-bold text-slate-800">Thanh toán thành công!</h1>
            <p className="mb-1 text-slate-600">
              Mã đơn hàng: <span className="font-mono font-semibold">{orderCode}</span>
            </p>
            {loadingDetail && (
              <p className="mt-3 flex items-center justify-center gap-2 text-sm text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Đang xác nhận trạng thái đăng ký...
              </p>
            )}
            {paymentDetail && (
              <p className="mt-2 text-sm text-green-700">
                Đăng ký đã được xác nhận. Kiểm tra QR code trong mục Đăng ký của tôi.
              </p>
            )}
            {paymentDetail && returnWorkshopId && (
              <p className="mt-2 text-sm text-blue-700">Đang chuyển về trang workshop trong {redirectSeconds}s...</p>
            )}
            {!loadingDetail && !paymentDetail && (
              <p className="mt-2 text-sm text-amber-700">
                Hệ thống đang xử lý xác nhận. Vui lòng kiểm tra mục{" "}
                <Link to="/my-registrations" className="underline font-medium">
                  Đăng ký của tôi
                </Link>{" "}
                sau vài giây.
              </p>
            )}
          </>
        ) : isCancelled ? (
          <>
            <XCircle className="mx-auto mb-4 h-16 w-16 text-amber-500" />
            <h1 className="mb-2 text-2xl font-bold text-slate-800">Thanh toán đã bị huỷ</h1>
            <p className="text-slate-600">Bạn đã huỷ giao dịch. Đăng ký chưa được xác nhận.</p>
          </>
        ) : (
          <>
            <Clock className="mx-auto mb-4 h-16 w-16 text-slate-400" />
            <h1 className="mb-2 text-2xl font-bold text-slate-800">Đang chờ xác nhận</h1>
            <p className="text-slate-600">
              Trạng thái thanh toán: <span className="font-semibold">{status ?? "không xác định"}</span>
            </p>
          </>
        )}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          {returnWorkshopId && (
            <Link
              to={`/workshops/${returnWorkshopId}`}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              <ArrowLeft className="h-4 w-4" />
              Quay lại workshop
            </Link>
          )}
          <Link
            to="/my-registrations"
            className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Xem đăng ký của tôi
          </Link>
        </div>
      </div>
    </StudentShell>
  );
}
