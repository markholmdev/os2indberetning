﻿
using System;

namespace Core.DomainModel
{
    public enum ReportStatus
    {
        Pending,
        Accepted,
        Rejected,
        Invoiced,
        Reported
    }

    public class Report
    {
        public int Id { get; set; }
        public ReportStatus Status { get; set; }
        public long CreatedDateTimestamp { get; set; }
        public long EditedDateTimestamp { get; set; }
        public String Comment { get; set; }
        public long ClosedDateTimestamp { get; set; }
        public long ProcessedDateTimestamp { get; set; }
        public Person ResponsibleLeader { get; set; }
        public virtual Person ApprovedBy { get; set; }
        public int? ApprovedById { get; set; }

        public int PersonId { get; set; }
        public virtual Person Person { get; set; }
        public int EmploymentId { get; set; }
        public virtual Employment Employment { get; set; }
    }
}
