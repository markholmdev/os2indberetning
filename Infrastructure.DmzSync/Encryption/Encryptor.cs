﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Core.DmzModel;

namespace Infrastructure.DmzSync.Encryption
{
    public static class Encryptor
    {
        private const string EncryptKey = "testpasswordkey";

        public static Profile EncryptProfile(Profile profile)
        {
            profile.FirstName = StringCipher.Encrypt(profile.FirstName, EncryptKey);
            profile.LastName = StringCipher.Encrypt(profile.LastName, EncryptKey);
            profile.HomeLatitude = StringCipher.Encrypt(profile.HomeLatitude, EncryptKey);
            profile.HomeLongitude = StringCipher.Encrypt(profile.HomeLongitude, EncryptKey);
            return profile;
        }

        public static Employment EncryptEmployment(Employment employment)
        {
            employment.EmploymentPosition = StringCipher.Encrypt(employment.EmploymentPosition, EncryptKey);
            return employment;
        }

        public static GPSCoordinate DecryptGPSCoordinate(GPSCoordinate gpscoord)
        {
            gpscoord.Latitude = StringCipher.Decrypt(gpscoord.Latitude, EncryptKey);
            gpscoord.Longitude = StringCipher.Decrypt(gpscoord.Longitude, EncryptKey);
            gpscoord.TimeStamp = StringCipher.Decrypt(gpscoord.TimeStamp, EncryptKey);
            return gpscoord;
        }

        public static Token EncryptToken(Token token)
        {
            token.GuId = StringCipher.Encrypt(token.GuId, EncryptKey);
            token.TokenString = StringCipher.Encrypt(token.TokenString, EncryptKey);
            return token;
        }

        public static Token DecryptToken(Token token)
        {
            token.GuId = StringCipher.Decrypt(token.GuId, EncryptKey);
            token.TokenString = StringCipher.Decrypt(token.TokenString, EncryptKey);
            return token;
        }

    }
}
