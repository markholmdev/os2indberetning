﻿using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data.Entity;
using System.Linq;
using System.Runtime.InteropServices;
using Core.ApplicationServices.Interfaces;
using Core.ApplicationServices.MailerService.Interface;
using Core.DomainModel;
using Core.DomainServices;
using Core.ApplicationServices.Logger;

namespace Core.ApplicationServices.MailerService.Impl
{
    public class MailService : IMailService
    {
        private readonly IGenericRepository<DriveReport> _driveRepo;
        private readonly IGenericRepository<Substitute> _subRepo;
        private readonly IMailSender _mailSender;
        private readonly IDriveReportService _driveReportService;
        private readonly ILogger _logger;

        public MailService(IGenericRepository<DriveReport> driveRepo, IGenericRepository<Substitute> subRepo, IMailSender mailSender, IDriveReportService driveReportService, ILogger logger)
        {
            _driveRepo = driveRepo;
            _subRepo = subRepo;
            _mailSender = mailSender;
            _driveReportService = driveReportService;
            _logger = logger;
        }

        /// <summary>
        /// Sends an email to all leaders with pending reports to be approved.
        /// </summary>
        public void SendMails(DateTime payRoleDateTime)
        {
            var mailAddresses = GetLeadersWithPendingReportsMails();

            var mailBody = ConfigurationManager.AppSettings["PROTECTED_MAIL_BODY"];
            if (string.IsNullOrEmpty(mailBody))
            {
                _logger.Debug($"{this.GetType().Name}, SendMails(): Mail body is null or empty, check value in CustomSettings.config");
            }
            mailBody = mailBody.Replace("####", payRoleDateTime.ToString("dd-MM-yyyy"));

            var mailSubject = ConfigurationManager.AppSettings["PROTECTED_MAIL_SUBJECT"];
            if (string.IsNullOrEmpty(mailSubject))
            {
                _logger.Debug($"{this.GetType().Name}, SendMails(): Mail subject is null or empty, check value in CustomSettings.config");
            }

            foreach (var mailAddress in mailAddresses)
            {
                _mailSender.SendMail(mailAddress, ConfigurationManager.AppSettings["PROTECTED_MAIL_SUBJECT"], mailBody);
            }
        }

        /// <summary>
        /// Gets the email address of all leaders that have pending reports to be approved.
        /// </summary>
        /// <returns>List of email addresses.</returns>
        public IEnumerable<string> GetLeadersWithPendingReportsMails()
        {
            var approverEmails = new HashSet<String>();

            var reports = _driveRepo.AsQueryable().Where(r => r.Status == ReportStatus.Pending).ToList();

            var reportsWithNoLeader = reports.Where(driveReport => driveReport.ResponsibleLeader == null);

            foreach (var report in reportsWithNoLeader)
            {
                _logger.LogForAdmin($"{report.Person.FullName}s indberetning har ingen leder. Indberetningen kan derfor ikke godkendes.");
                _logger.Error($"{this.GetType().Name}, GetLeadersWithPendingReportsMails(): {report.Person.FullName}s indberetning har ingen leder. Indberetningen kan derfor ikke godkendes.");
            }

            foreach (var driveReport in reports.Where(driveReport => driveReport.ResponsibleLeaderId != null && !string.IsNullOrEmpty(driveReport.ResponsibleLeader.Mail) && driveReport.ResponsibleLeader.RecieveMail))
            {
                approverEmails.Add(driveReport.ResponsibleLeader.Mail);
            }

            return approverEmails;
        }
    }
}
