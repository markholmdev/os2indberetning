﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Core.DomainModel;
using Core.DomainServices.RoutingClasses;
using Infrastructure.AddressServices.Interfaces;
using log4net;

namespace Core.DomainServices
{
    public class CachedAddressLaunderer : IAddressLaunderer
    {
        private IGenericRepository<CachedAddress> _repo;
        private readonly IAddressLaunderer _actualLaunderer;
        private readonly IAddressCoordinates _coordinates;

        private static readonly ILog Logger = LogManager.GetLogger(System.Reflection.MethodBase.GetCurrentMethod().DeclaringType);

        public CachedAddressLaunderer(IGenericRepository<CachedAddress> repo, IAddressLaunderer actualLaunderer, IAddressCoordinates coordinates)
        {
            _repo = repo;
            _actualLaunderer = actualLaunderer;
            _coordinates = coordinates;
        }

        public Address Launder(Address inputAddress)
        {
            var inputAddressString = inputAddress.StreetName + " " + inputAddress.StreetNumber + ", " + inputAddress.ZipCode + " " + inputAddress.Town;
            var cachedAddress = _repo.AsQueryable()
                .FirstOrDefault(addr => addr.DirtyString.Equals(inputAddressString));

            if (cachedAddress != null && !cachedAddress.IsDirty)
            {
                return cachedAddress;
            }

            var newCachedAddress = false;

            if (cachedAddress == null)
            {
                cachedAddress = new CachedAddress(inputAddress);
                newCachedAddress = true;
            }

            var isDirty = false;

            try
            {
                cachedAddress = (CachedAddress)_actualLaunderer.Launder(cachedAddress);
            }
            catch (AddressLaunderingException e)
            {
                Logger.Error("Fejl ved adressevask", e);
                isDirty = true;
            }
            if (cachedAddress.Latitude == null || cachedAddress.Latitude.Equals("0"))
            {
                try
                {
                    _coordinates.GetAddressCoordinates(cachedAddress, true);
                }
                catch (AddressCoordinatesException e)
                {
                    Logger.Error("Fejl ved opslag af adressekoordinater", e);
                    isDirty = true;
                    cachedAddress.Latitude = "0";
                    cachedAddress.Longitude = "0";
                }
            }
            cachedAddress.IsDirty = isDirty;
            if ( newCachedAddress ){
                cachedAddress = _repo.Insert(cachedAddress);
            }
            else
            {
                _repo.Update(cachedAddress);
            }
            _repo.Save();

            return cachedAddress;
        }
    }
}
