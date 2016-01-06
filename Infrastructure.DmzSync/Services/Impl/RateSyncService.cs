﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Core.ApplicationServices.Interfaces;
using Core.DmzModel;
using Core.DomainModel;
using Core.DomainServices;
using Infrastructure.DataAccess;
using Infrastructure.DmzDataAccess;
using Infrastructure.DmzSync.Encryption;
using Infrastructure.DmzSync.Services.Interface;
using Employment = Core.DmzModel.Employment;

namespace Infrastructure.DmzSync.Services.Impl
{
    public class RateSyncService : ISyncService
    {
        private IGenericRepository<Core.DmzModel.Rate> _dmzRateRepo;
        private IGenericRepository<Core.DomainModel.Rate> _masterRateRepo;

        public RateSyncService(IGenericRepository<Core.DmzModel.Rate> dmzRateRepo, IGenericRepository<Core.DomainModel.Rate> masterRateRepo)
        {
            _dmzRateRepo = dmzRateRepo;
            _masterRateRepo = masterRateRepo;
        }

        /// <summary>
        /// Not implemented.
        /// </summary>
        public void SyncFromDmz()
        {
            // We are not interested in migrating rates from DMZ to os2.
            throw new NotImplementedException();
        }


        /// <summary>
        /// Syncs all rates from OS2 database to DMZ database.
        /// </summary>
        public void SyncToDmz()
        {
            var i = 0;
            var currentYear = DateTime.Now.Year;
            var rateList = _masterRateRepo.AsQueryable().Where(x => x.Active && x.Year == currentYear).ToList();
            var max = rateList.Count;

            foreach (var rate in rateList)  
            {
                i++;
                if (i%10 == 0)
                {
                    Console.WriteLine("Syncing rate " + i + " of " + max);
                }

                var dmzRate = new Core.DmzModel.Rate()
                    {
                        Id = rate.Id,
                        Description = rate.Type.Description,
                        Year = rate.Year.ToString()
                    };
                _dmzRateRepo.Insert(dmzRate);
            }
             _dmzRateRepo.Save();
        }


        /// <summary>
        /// Clears DMZ database of all rates.
        /// </summary>
        public void ClearDmz()
        {
            var rateList = _dmzRateRepo.AsQueryable().ToList();
            _dmzRateRepo.DeleteRange(rateList);
            _dmzRateRepo.Save();
        }
    }
}
