﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Core.ApplicationServices.Interfaces
{
    public interface ILicensePlateService
    {
        bool MakeLicensePlatePrimary(int plateId);
    }
}
