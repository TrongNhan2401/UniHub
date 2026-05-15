using Domain.Entities;
using System.Threading.Tasks;
using System.Collections.Generic;
using System;
using Domain.Entities;
using System.Threading.Tasks;
using System.Collections.Generic;
using System;
using System.Linq;
using Microsoft.EntityFrameworkCore;

namespace Application.Abstractions.Repositories
{
    public interface IWorkshopRepo
    {
        Task<Workshop> AddAsync(Workshop workshop);
        Task<(List<Workshop> Items, int TotalCount)> GetPagedAsync(int pageNumber, int pageSize, System.DateTime? date = null, string? status = null, string? sortByTime = null, bool includeDrafts = true);
        Task<Workshop?> GetByIdAsync(Guid id, bool includeDrafts = true);
        Task<Workshop?> GetByIdWithTrackingAsync(Guid id);
    }
}
