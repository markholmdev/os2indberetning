﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using DBUpdater.Models;

namespace DBUpdater
{
    public interface IDBUpdaterDataProvider
    {
        IQueryable<Employee> GetEmployeesAsQueryable();
        IQueryable<Organisation> GetOrganisationsAsQueryable();
    }
}
