﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Core.DomainModel;
using Core.DomainServices;

namespace Core.ApplicationServices
{
    public class OrgUnitService : IOrgUnitService
    {
        private readonly IGenericRepository<Employment> _emplRepo;
        private readonly IGenericRepository<OrgUnit> _orgRepo;

        public OrgUnitService(IGenericRepository<Employment> emplRepo, IGenericRepository<OrgUnit> orgRepo)
        {
            _emplRepo = emplRepo;
            _orgRepo = orgRepo;
        }

        public List<OrgUnit> GetWhereUserIsResponsible(int personId)
        {
            var result = new List<OrgUnit>();

            var leaderEmpls = _emplRepo.AsQueryable().Where(e => e.IsLeader && e.PersonId == personId).ToList(); // ToList to force close the datareader
            foreach (var employment in leaderEmpls)
            {
                var empl = employment;
                result.Add(empl.OrgUnit);
                result.AddRange(GetChildOrgsWithoutLeader(empl.OrgUnitId));
            }
            return result;
        }

        public IEnumerable<OrgUnit> GetChildOrgsWithoutLeader(int parentOrgId)
        {
            var result = new List<OrgUnit>();
            var childOrgs = _orgRepo.AsQueryable().Where(org => org.ParentId == parentOrgId).ToList(); // ToList to force close the datareader.
            foreach (var childOrg in childOrgs)
            {
                var org = childOrg;
                if (!_emplRepo.AsQueryable().Any(e => e.IsLeader && e.OrgUnitId == org.Id))
                {
                    result.Add(org);
                    result.AddRange(GetChildOrgsWithoutLeader(org.Id));
                }
            }
            return result;
        }
    }
}
