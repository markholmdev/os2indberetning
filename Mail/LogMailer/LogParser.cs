﻿using Core.ApplicationServices;
using Core.ApplicationServices.Logger;
using Ninject;
using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Mail.LogMailer
{
    public class LogParser : ILogParser
    {
        private ILogger _logger = NinjectWebKernel.CreateKernel().Get<ILogger>();

        public List<string> Messages(List<string> log, DateTime fromDate)
        {
            var messages = new List<string>();

            foreach (var line in log)
            {
                try
                {
                    var indexString = " : ";

                    var index = line.LastIndexOf(indexString, StringComparison.CurrentCulture);

                    var stringDate = line.Substring(0, index);
                    var message = line.Substring(index + indexString.Count(), (line.Count() - (index + indexString.Count())));


                    Console.WriteLine(stringDate);
                    var date = DateTime.ParseExact(stringDate, "dd-MM-yyyy HH:mm:ss", CultureInfo.InvariantCulture);

                    if (date < fromDate) break;

                    messages.Add(message);
                }
                catch (Exception e)
                {
                    _logger.Log($"{this.GetType().Name}, Messages(): Error when parsing log entry", "mail", e, 1);
                    Console.WriteLine(e.Message);
                }

            }

            return messages;
        }
    }
}
