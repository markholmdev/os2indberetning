﻿using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data;
using System.Data.SqlClient;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using DBUpdater.Models;
using Core.ApplicationServices;
using Ninject;
using Core.ApplicationServices.Logger;

namespace DBUpdater
{
    public class DataProvider : IDbUpdaterDataProvider
    {
        private readonly string _connectionString = ConfigurationManager.ConnectionStrings["DBUpdaterConnection"].ConnectionString;

        private ILogger _logger = NinjectWebKernel.CreateKernel().Get<ILogger>();

        /// <summary>
        /// Reads employees from Kommune database and returns them asqueryable.
        /// </summary>
        /// <returns></returns>
        public IQueryable<Employee> GetEmployeesAsQueryable()
        {
            _logger.Debug($"{GetType().Name}, GetEmployeesAsQueryable(), Employee import from views started");

            var result = new List<Employee>();

            using (var sqlConnection1 = new SqlConnection(_connectionString))
            {
                string medarbejderView = ConfigurationManager.AppSettings["PROTECTED_DATABASE_VIEW_MEDARBEJDER"];

                if(medarbejderView == null)
                {
                    _logger.Error($"{this.GetType().Name}, GetEmployeesAsQueryable(), DATABASE_VIEW_MEDARBEJDER is null");
                }

                var cmd = new SqlCommand
                {
                    CommandText = "SELECT * FROM " + medarbejderView,
                    CommandType = CommandType.Text,
                    Connection = sqlConnection1
                };

                try
                {
                    sqlConnection1.Open();
                    var reader = cmd.ExecuteReader();

                    while (reader.Read())
                    {
                        int? manr = 0;
                        try
                        {
                            manr = SafeGetInt32(reader, 0);
                            var currentRow = new Employee
                            {
                                MaNr = manr,
                                AnsaettelsesDato = SafeGetDate(reader, 1),
                                OphoersDato = SafeGetDate(reader, 2),
                                Fornavn = SafeGetString(reader, 3),
                                Efternavn = SafeGetString(reader, 4),
                                ADBrugerNavn = SafeGetString(reader, 5),
                                Adresse = SafeGetString(reader, 6),
                                Stednavn = SafeGetString(reader, 7),
                                PostNr = SafeGetString(reader, 8) == null ? 0 : int.Parse(SafeGetString(reader, 8)),
                                By = SafeGetString(reader, 9),
                                Land = SafeGetString(reader, 10),
                                Email = SafeGetString(reader, 11),
                                CPR = SafeGetString(reader, 12),
                                LOSOrgId = SafeGetInt32(reader, 13),
                                Leder = reader.GetBoolean(14),
                                Stillingsbetegnelse = SafeGetString(reader, 15),
                                Omkostningssted = SafeGetInt64(reader, 16),
                                AnsatForhold = SafeGetString(reader, 17),
                                EkstraCiffer = SafeGetInt16(reader, 18)
                            };
                            result.Add(currentRow);
                        }
                        catch (Exception e)
                        {
                            _logger.Error($"{this.GetType().Name}, GetEmployeesAsQueryable(), Error when reading data for employee with MaNr={manr}", e);
                            throw;
                        }
                    }
                }
                catch (Exception e)
                {
                    _logger.Error($"{this.GetType().Name}, GetEmployeesAsQueryable(), Error when importing employees, DATABASE_VIEW_MEDARBEJDER={medarbejderView}", e);
                    throw;
                }
            }
            return result.AsQueryable();
        }

        /// <summary>
        /// Read Organisations from Kommune database and returns them asQueryably.
        /// </summary>
        /// <returns></returns>
        public IQueryable<Organisation> GetOrganisationsAsQueryable()
        {
            string organisationView = ConfigurationManager.AppSettings["PROTECTED_DATABASE_VIEW_ORGANISATION"];

            if (organisationView == null)
            {
                _logger.Error($"{this.GetType().Name}, GetOrganisationsAsQueryable(): DATABASE_VIEW_ORGANISATION is null");
            }

            var result = new List<Organisation>();
            using (var sqlConnection1 = new SqlConnection(_connectionString))
            {
                var cmd = new SqlCommand
                {
                    CommandText = "SELECT * FROM " + organisationView,
                    CommandType = CommandType.Text,
                    Connection = sqlConnection1
                };

                try
                {
                    sqlConnection1.Open();
                    var reader = cmd.ExecuteReader();
                    while (reader.Read())
                    {
                        int LOSOrgId = -1;
                        try
                        {
                            LOSOrgId = reader.GetInt32(0);
                            var currentRow = new Organisation
                            {
                                LOSOrgId = LOSOrgId,
                                ParentLosOrgId = SafeGetInt32(reader, 1),
                                KortNavn = SafeGetString(reader, 2),
                                Navn = SafeGetString(reader, 3),
                                Gade = SafeGetString(reader, 4),
                                Stednavn = SafeGetString(reader, 5),
                                Postnr = SafeGetInt16(reader, 6),
                                By = SafeGetString(reader, 7),
                                Omkostningssted = SafeGetInt64(reader, 8),
                                Level = reader.GetInt32(9)
                            };

                            result.Add(currentRow);
                        }
                        catch (Exception e)
                        {
                            _logger.Error($"{this.GetType().Name}, GetOrganisationsAsQueryable(), Error when reading data for LOSOrgId={LOSOrgId}", e);
                            throw;
                        }
                    }
                }
                catch (Exception e)
                {
                    _logger.Error($"{this.GetType().Name}, GetOrganisationsAsQueryable(), Error when importing orgunits, DATABASE_VIEW_ORGANISATION={organisationView}", e);
                    throw;
                }
            }
            return result.AsQueryable();
        }

        private DateTime? SafeGetDate(SqlDataReader reader, int colIndex)
        {
            if (!reader.IsDBNull(colIndex))
            {
                DateTime data;
                try
                {
                    data = reader.GetDateTime(colIndex);
                }
                catch (Exception)
                {
                    _logger.Error($"{this.GetType().Name}, SafeGetDate(), Error for colIndex={colIndex}");
                    throw;
                }
                return data;
            }
            return null;
        }

        private string SafeGetString(SqlDataReader reader, int colIndex)
        {
            if (!reader.IsDBNull(colIndex))
            {
                string data;
                try
                {
                    data = reader.GetString(colIndex);
                }
                catch (Exception)
                {
                    _logger.Error($"{this.GetType().Name}, SafeGetString(), Error for colIndex={colIndex}");
                    throw;
                }
                return data;
            }
            return null;
        }

        private int? SafeGetInt16(SqlDataReader reader, int colIndex)
        {
            if (!reader.IsDBNull(colIndex))
            {
                // This if statement was added because Syddjurs changed their datatype on a row from smallint to tinyint, while Favrskov did not.
                // A tinyint is a byte, which is handled by the first check.
                // A smallint will be handled by the else statement.
                int? data;
                try
                {
                    if (reader.GetFieldType(colIndex) == typeof(byte))
                    {
                        var b = reader.GetByte(colIndex);
                        data = Convert.ToInt32(b);
                    }
                    else
                    {
                        data = reader.GetInt16(colIndex);
                    }
                }
                catch (Exception)
                {
                    _logger.Error($"{this.GetType().Name}, SafeGetInt16(), Error for colIndex={colIndex}");
                    throw;
                }
                return data;
            }
            return null;
        }

        private int? SafeGetInt32(SqlDataReader reader, int colIndex)
        {
            if (!reader.IsDBNull(colIndex))
            {
                int? data;
                try
                {
                    data = reader.GetInt32(colIndex);
                }
                catch (Exception)
                {
                    _logger.Error($"{this.GetType().Name}, SafeGetInt32(), Error for colIndex={colIndex}");
                    throw;
                }
                return data;
            }
            return null;
        }

        private long? SafeGetInt64(SqlDataReader reader, int colIndex)
        {
            if (!reader.IsDBNull(colIndex))
            {
                long? data;
                try
                {
                    data = reader.GetInt64(colIndex);
                }
                catch (Exception)
                {
                    _logger.Error($"{this.GetType().Name}, SafeGetInt64(), Error for colIndex={colIndex}");
                    throw;
                }
                return data;
            }
            return null;
        }
    }
}
