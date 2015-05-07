﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Cryptography.X509Certificates;
using System.Text;
using System.Threading.Tasks;
using Core.DomainModel;
using Core.DomainServices;
using DBUpdater.Models;
using Infrastructure.AddressServices.Interfaces;
using NSubstitute;
using NUnit.Framework;
using IAddressCoordinates = Core.DomainServices.IAddressCoordinates;

namespace DBUpdater.Test
{
    [TestFixture]
    public class MigrateEmployeesTest
    {
        private UpdateService _uut;
        private IGenericRepository<Employment> _emplRepoMock;
        private IGenericRepository<OrgUnit> _orgUnitRepoMock;
        private IGenericRepository<Person> _personRepoMock;
        private IGenericRepository<CachedAddress> _cachedAddressRepoMock;
        private IGenericRepository<PersonalAddress> _personalAddressRepoMock;
        private IAddressLaunderer _actualLaunderer;
        private IAddressCoordinates _coordinates;
        private IDbUpdaterDataProvider _dataProvider;
        private IGenericRepository<WorkAddress> _workAddressRepoMock;

        [SetUp]
        public void SetUp()
        {
            var personList = new List<Person>();
            var emplList = new List<Employment>();

            var emplIdCount = 0;
            var personIdCount = 0;

            var cachedAddressList = new List<CachedAddress>();
            var cachedIdCount = 0;
            var personalAddressList = new List<PersonalAddress>();
            var personalIdCount = 0;

            _emplRepoMock = NSubstitute.Substitute.For<IGenericRepository<Employment>>();
            _orgUnitRepoMock = NSubstitute.Substitute.For<IGenericRepository<OrgUnit>>();
            _personRepoMock = NSubstitute.Substitute.For<IGenericRepository<Person>>();
            _cachedAddressRepoMock = NSubstitute.Substitute.For<IGenericRepository<CachedAddress>>();
            _personalAddressRepoMock = NSubstitute.Substitute.For<IGenericRepository<PersonalAddress>>();
            _actualLaunderer = NSubstitute.Substitute.For<IAddressLaunderer>();
            _coordinates = NSubstitute.Substitute.For<IAddressCoordinates>();
            _dataProvider = NSubstitute.Substitute.For<IDbUpdaterDataProvider>();
            _workAddressRepoMock = NSubstitute.Substitute.For<IGenericRepository<WorkAddress>>();

            _personRepoMock.AsQueryable().Returns(personList.AsQueryable());

            _personRepoMock.Insert(new Person()).ReturnsForAnyArgs(x => x.Arg<Person>()).AndDoes(x => personList.Add(x.Arg<Person>())).AndDoes(x => x.Arg<Person>().Id = personIdCount).AndDoes(x => personIdCount++);

            _emplRepoMock.AsQueryable().Returns(emplList.AsQueryable());

            _emplRepoMock.Insert(new Employment()).ReturnsForAnyArgs(x => x.Arg<Employment>()).AndDoes(x => emplList.Add(x.Arg<Employment>())).AndDoes(x => x.Arg<Employment>().Id = emplIdCount).AndDoes(x => emplIdCount++);

            _cachedAddressRepoMock.Insert(new CachedAddress()).ReturnsForAnyArgs(x => x.Arg<CachedAddress>()).AndDoes(x => cachedAddressList.Add(x.Arg<CachedAddress>())).AndDoes(x => x.Arg<CachedAddress>().Id = cachedIdCount).AndDoes(x => cachedIdCount++);

            _cachedAddressRepoMock.AsQueryable().Returns(cachedAddressList.AsQueryable());

            _personalAddressRepoMock.Insert(new PersonalAddress()).ReturnsForAnyArgs(x => x.Arg<PersonalAddress>()).AndDoes(x => personalAddressList.Add(x.Arg<PersonalAddress>())).AndDoes(x => x.Arg<PersonalAddress>().Id = personalIdCount).AndDoes(x => personalIdCount++);

            _personalAddressRepoMock.AsQueryable().Returns(personalAddressList.AsQueryable());


            _uut = new UpdateService(_emplRepoMock, _orgUnitRepoMock, _personRepoMock, _cachedAddressRepoMock,
                _personalAddressRepoMock, _actualLaunderer, _coordinates, _dataProvider, _workAddressRepoMock);

            _orgUnitRepoMock.AsQueryable().ReturnsForAnyArgs(new List<OrgUnit>()
            {
                new OrgUnit()
                {
                    Id = 1,
                    OrgId = 1,
                    ShortDescription = "ITM",
                    LongDescription = "IT Minds, Aarhus",
                    Level = 0,
                    HasAccessToFourKmRule = false,
                },
                new OrgUnit()
                {
                    Id = 2,
                    OrgId = 2,
                    ShortDescription = "ITMB",
                    LongDescription = "IT Minds, Aarhus child",
                    Level = 1,
                    ParentId = 1,
                    HasAccessToFourKmRule = false,
                }
            }.AsQueryable());
        }

        [Test]
        public void TwoEmployees_At2OrgUnits_ShouldAddPersonsAndEmployments()
        {
            _dataProvider.GetEmployeesAsQueryable().Returns(new List<Employee>()
            {
                new Employee()
                {
                    ADBrugerNavn = "joj",
                    Adresse = "Jens Baggesens Vej 44",
                    AnsaettelsesDato = new DateTime(2015,4,28),
                    By = "Aarhus V",
                    CPR = "123456781234",
                    Fornavn = "Jacob Overgaard",
                    Efternavn = "Jensen",
                    Email = "Test@mail.dk",
                    Land = "DK",
                    Leder = false,
                    MaNr = 1,
                    PostNr = 8210,
                    Stillingsbetegnelse = "Udvikler",
                    AnsatForhold = "0",
                    LOSOrgId = 1,
                    Stednavn = "",
                    EkstraCiffer = 1
                },
                new Employee()
                {
                    ADBrugerNavn = "mra",
                    Adresse = "Katrinebjergvej 93b",
                    AnsaettelsesDato = new DateTime(2015,4,28),
                    By = "Aarhus N",
                    CPR = "123456781234",
                    Fornavn = "Morten",
                    Efternavn = "Rasmussen",
                    Email = "Test@mail.dk",
                    Land = "DK",
                    Leder = true,
                    MaNr = 2,
                    PostNr = 8200,
                    Stillingsbetegnelse = "Udvikler",
                    AnsatForhold = "3",
                    LOSOrgId = 2,
                    Stednavn = "",
                    EkstraCiffer = 3,
                    
                }
            }.AsQueryable());

            _uut.MigrateEmployees();
            var res = _personRepoMock.AsQueryable();
            var empl = _emplRepoMock.AsQueryable();

            _emplRepoMock.ReceivedWithAnyArgs().Insert(new Employment());
            _personRepoMock.ReceivedWithAnyArgs().Insert(new Person());
            Assert.That(res.ElementAt(0).Initials.Equals("joj"));
            Assert.That(res.ElementAt(0).FirstName.Equals("Jacob Overgaard"));
            Assert.That(res.ElementAt(0).LastName.Equals("Jensen"));
            Assert.That(res.ElementAt(0).CprNumber.Equals("123456781234"));
            Assert.That(res.ElementAt(0).IsAdmin.Equals(false));
            Assert.That(res.ElementAt(0).Mail.Equals("Test@mail.dk"));
            Assert.That(res.ElementAt(0).PersonId.Equals(1));
            Assert.That(res.ElementAt(0).RecieveMail.Equals(false));

            Assert.That(empl.ElementAt(0).OrgUnitId.Equals(1));
            Assert.That(empl.ElementAt(0).StartDateTimestamp.Equals(1430179200));
            Assert.That(empl.ElementAt(0).EndDateTimestamp.Equals(0));
            Assert.That(empl.ElementAt(0).ExtraNumber.Equals(1));
            Assert.That(empl.ElementAt(0).EmploymentType.Equals(0));
            Assert.That(empl.ElementAt(0).IsLeader.Equals(false));
            Assert.That(empl.ElementAt(0).PersonId.Equals(res.ElementAt(0).Id));
            Assert.That(empl.ElementAt(0).Position.Equals("Udvikler"));

            Assert.That(res.ElementAt(1).Initials.Equals("mra"));
            Assert.That(res.ElementAt(1).FirstName.Equals("Morten"));
            Assert.That(res.ElementAt(1).LastName.Equals("Rasmussen"));
            Assert.That(res.ElementAt(1).CprNumber.Equals("123456781234"));
            Assert.That(res.ElementAt(1).IsAdmin.Equals(false));
            Assert.That(res.ElementAt(1).Mail.Equals("Test@mail.dk"));
            Assert.That(res.ElementAt(1).PersonId.Equals(2));
            Assert.That(res.ElementAt(1).RecieveMail.Equals(false));

            Assert.That(empl.ElementAt(1).OrgUnitId.Equals(2));
            Assert.That(empl.ElementAt(1).StartDateTimestamp.Equals(1430179200));
            Assert.That(empl.ElementAt(1).EndDateTimestamp.Equals(0));
            Assert.That(empl.ElementAt(1).ExtraNumber.Equals(3));
            Assert.That(empl.ElementAt(1).EmploymentType.Equals(3));
            Assert.That(empl.ElementAt(1).IsLeader.Equals(true));
            Assert.That(empl.ElementAt(1).PersonId.Equals(res.ElementAt(1).Id));
            Assert.That(empl.ElementAt(1).Position.Equals("Udvikler"));          
        }

        [Test]
        public void TwoEmployees_At1OrgUnit_ShouldAddPersonsAndEmployments()
        {
            _dataProvider.GetEmployeesAsQueryable().Returns(new List<Employee>()
            {
                new Employee()
                {
                    ADBrugerNavn = "joj",
                    Adresse = "Jens Baggesens Vej 44",
                    AnsaettelsesDato = new DateTime(2015,4,28),
                    By = "Aarhus V",
                    CPR = "123456781234",
                    Fornavn = "Jacob Overgaard",
                    Efternavn = "Jensen",
                    Email = "Test@mail.dk",
                    Land = "DK",
                    Leder = false,
                    MaNr = 1,
                    PostNr = 8210,
                    Stillingsbetegnelse = "Udvikler",
                    AnsatForhold = "0",
                    LOSOrgId = 1,
                    Stednavn = "",
                    EkstraCiffer = 1
                },
                new Employee()
                {
                    ADBrugerNavn = "mra",
                    Adresse = "Katrinebjergvej 93b",
                    AnsaettelsesDato = new DateTime(2015,4,28),
                    By = "Aarhus N",
                    CPR = "123456781234",
                    Fornavn = "Morten",
                    Efternavn = "Rasmussen",
                    Email = "Test@mail.dk",
                    Land = "DK",
                    Leder = true,
                    MaNr = 2,
                    PostNr = 8200,
                    Stillingsbetegnelse = "Udvikler",
                    AnsatForhold = "3",
                    LOSOrgId = 1,
                    Stednavn = "",
                    EkstraCiffer = 3,
                    
                }
            }.AsQueryable());

            _uut.MigrateEmployees();
            var res = _personRepoMock.AsQueryable();
            var empl = _emplRepoMock.AsQueryable();

            _personRepoMock.ReceivedWithAnyArgs().Insert(new Person());
            _emplRepoMock.ReceivedWithAnyArgs().Insert(new Employment());
            Assert.That(res.ElementAt(0).Initials.Equals("joj"));
            Assert.That(res.ElementAt(0).FirstName.Equals("Jacob Overgaard"));
            Assert.That(res.ElementAt(0).LastName.Equals("Jensen"));
            Assert.That(res.ElementAt(0).CprNumber.Equals("123456781234"));
            Assert.That(res.ElementAt(0).IsAdmin.Equals(false));
            Assert.That(res.ElementAt(0).Mail.Equals("Test@mail.dk"));
            Assert.That(res.ElementAt(0).PersonId.Equals(1));
            Assert.That(res.ElementAt(0).RecieveMail.Equals(false));

            Assert.That(empl.ElementAt(0).OrgUnitId.Equals(1));
            Assert.That(empl.ElementAt(0).StartDateTimestamp.Equals(1430179200));
            Assert.That(empl.ElementAt(0).EndDateTimestamp.Equals(0));
            Assert.That(empl.ElementAt(0).ExtraNumber.Equals(1));
            Assert.That(empl.ElementAt(0).EmploymentType.Equals(0));
            Assert.That(empl.ElementAt(0).IsLeader.Equals(false));
            Assert.That(empl.ElementAt(0).PersonId.Equals(res.ElementAt(0).Id));
            Assert.That(empl.ElementAt(0).Position.Equals("Udvikler"));

            Assert.That(res.ElementAt(1).Initials.Equals("mra"));
            Assert.That(res.ElementAt(1).FirstName.Equals("Morten"));
            Assert.That(res.ElementAt(1).LastName.Equals("Rasmussen"));
            Assert.That(res.ElementAt(1).CprNumber.Equals("123456781234"));
            Assert.That(res.ElementAt(1).IsAdmin.Equals(false));
            Assert.That(res.ElementAt(1).Mail.Equals("Test@mail.dk"));
            Assert.That(res.ElementAt(1).PersonId.Equals(2));
            Assert.That(res.ElementAt(1).RecieveMail.Equals(false));

            Assert.That(empl.ElementAt(1).OrgUnitId.Equals(1));
            Assert.That(empl.ElementAt(1).StartDateTimestamp.Equals(1430179200));
            Assert.That(empl.ElementAt(1).EndDateTimestamp.Equals(0));
            Assert.That(empl.ElementAt(1).ExtraNumber.Equals(3));
            Assert.That(empl.ElementAt(1).EmploymentType.Equals(3));
            Assert.That(empl.ElementAt(1).IsLeader.Equals(true));
            Assert.That(empl.ElementAt(1).PersonId.Equals(res.ElementAt(1).Id));
            Assert.That(empl.ElementAt(1).Position.Equals("Udvikler"));
        }

        [Test]
        public void ExistingEmployee_ShouldNotCallInsert_ButShouldUpdateData()
        {
            _personRepoMock.Insert(new Person()
            {
                PersonId = 1
            });

            _personRepoMock.ClearReceivedCalls();

            _dataProvider.GetEmployeesAsQueryable().Returns(new List<Employee>()
            {
                new Employee()
                {
                    ADBrugerNavn = "joj",
                    Adresse = "Jens Baggesens Vej 44",
                    AnsaettelsesDato = new DateTime(2015,4,28),
                    By = "Aarhus V",
                    CPR = "123456781234",
                    Fornavn = "Jacob Overgaard",
                    Efternavn = "Jensen",
                    Email = "Test@mail.dk",
                    Land = "DK",
                    Leder = false,
                    MaNr = 1,
                    PostNr = 8210,
                    Stillingsbetegnelse = "Udvikler",
                    AnsatForhold = "0",
                    LOSOrgId = 1,
                    Stednavn = "",
                    EkstraCiffer = 1
                }
            }.AsQueryable());

            _uut.MigrateEmployees();
            var res = _personRepoMock.AsQueryable();
            var empl = _emplRepoMock.AsQueryable();

            _personRepoMock.DidNotReceiveWithAnyArgs().Insert(new Person());
            _emplRepoMock.ReceivedWithAnyArgs().Insert(new Employment());
            Assert.That(res.ElementAt(0).Initials.Equals("joj"));
            Assert.That(res.ElementAt(0).FirstName.Equals("Jacob Overgaard"));
            Assert.That(res.ElementAt(0).LastName.Equals("Jensen"));
            Assert.That(res.ElementAt(0).CprNumber.Equals("123456781234"));
            Assert.That(res.ElementAt(0).IsAdmin.Equals(false));
            Assert.That(res.ElementAt(0).Mail.Equals("Test@mail.dk"));
            Assert.That(res.ElementAt(0).PersonId.Equals(1));
            Assert.That(res.ElementAt(0).RecieveMail.Equals(false));

            Assert.That(empl.ElementAt(0).OrgUnitId.Equals(1));
            Assert.That(empl.ElementAt(0).StartDateTimestamp.Equals(1430179200));
            Assert.That(empl.ElementAt(0).EndDateTimestamp.Equals(0));
            Assert.That(empl.ElementAt(0).ExtraNumber.Equals(1));
            Assert.That(empl.ElementAt(0).EmploymentType.Equals(0));
            Assert.That(empl.ElementAt(0).IsLeader.Equals(false));
            Assert.That(empl.ElementAt(0).PersonId.Equals(res.ElementAt(0).Id));
            Assert.That(empl.ElementAt(0).Position.Equals("Udvikler"));
        }

        [Test]
        public void EmployeeWithNo_ADUserName_ShouldSetInitialsToBlank()
        {
            _dataProvider.GetEmployeesAsQueryable().Returns(new List<Employee>()
            {
                new Employee()
                {
                    Adresse = "Jens Baggesens Vej 44",
                    AnsaettelsesDato = new DateTime(2015,4,28),
                    By = "Aarhus V",
                    CPR = "123456781234",
                    Fornavn = "Jacob Overgaard",
                    Efternavn = "Jensen",
                    Email = "Test@mail.dk",
                    Land = "DK",
                    Leder = false,
                    MaNr = 1,
                    PostNr = 8210,
                    Stillingsbetegnelse = "Udvikler",
                    AnsatForhold = "0",
                    LOSOrgId = 1,
                    Stednavn = "",
                    EkstraCiffer = 1
                },
                new Employee()
                {
                    Adresse = "Katrinebjergvej 93b",
                    AnsaettelsesDato = new DateTime(2015,4,28),
                    By = "Aarhus N",
                    CPR = "123456781234",
                    Fornavn = "Morten",
                    Efternavn = "Rasmussen",
                    Email = "Test@mail.dk",
                    Land = "DK",
                    Leder = true,
                    MaNr = 2,
                    PostNr = 8200,
                    Stillingsbetegnelse = "Udvikler",
                    AnsatForhold = "3",
                    LOSOrgId = 1,
                    Stednavn = "",
                    EkstraCiffer = 3,
                    
                }
            }.AsQueryable());

            _uut.MigrateEmployees();
            var res = _personRepoMock.AsQueryable();
            var empl = _emplRepoMock.AsQueryable();

            _personRepoMock.ReceivedWithAnyArgs().Insert(new Person());
            _emplRepoMock.ReceivedWithAnyArgs().Insert(new Employment());
            Assert.That(res.ElementAt(0).Initials.Equals(" "));
            Assert.That(res.ElementAt(0).FirstName.Equals("Jacob Overgaard"));
            Assert.That(res.ElementAt(0).LastName.Equals("Jensen"));
            Assert.That(res.ElementAt(0).CprNumber.Equals("123456781234"));
            Assert.That(res.ElementAt(0).IsAdmin.Equals(false));
            Assert.That(res.ElementAt(0).Mail.Equals("Test@mail.dk"));
            Assert.That(res.ElementAt(0).PersonId.Equals(1));
            Assert.That(res.ElementAt(0).RecieveMail.Equals(false));

            Assert.That(empl.ElementAt(0).OrgUnitId.Equals(1));
            Assert.That(empl.ElementAt(0).StartDateTimestamp.Equals(1430179200));
            Assert.That(empl.ElementAt(0).EndDateTimestamp.Equals(0));
            Assert.That(empl.ElementAt(0).ExtraNumber.Equals(1));
            Assert.That(empl.ElementAt(0).EmploymentType.Equals(0));
            Assert.That(empl.ElementAt(0).IsLeader.Equals(false));
            Assert.That(empl.ElementAt(0).PersonId.Equals(res.ElementAt(0).Id));
            Assert.That(empl.ElementAt(0).Position.Equals("Udvikler"));

            Assert.That(res.ElementAt(1).Initials.Equals(" "));
            Assert.That(res.ElementAt(1).FirstName.Equals("Morten"));
            Assert.That(res.ElementAt(1).LastName.Equals("Rasmussen"));
            Assert.That(res.ElementAt(1).CprNumber.Equals("123456781234"));
            Assert.That(res.ElementAt(1).IsAdmin.Equals(false));
            Assert.That(res.ElementAt(1).Mail.Equals("Test@mail.dk"));
            Assert.That(res.ElementAt(1).PersonId.Equals(2));
            Assert.That(res.ElementAt(1).RecieveMail.Equals(false));

            Assert.That(empl.ElementAt(1).OrgUnitId.Equals(1));
            Assert.That(empl.ElementAt(1).StartDateTimestamp.Equals(1430179200));
            Assert.That(empl.ElementAt(1).EndDateTimestamp.Equals(0));
            Assert.That(empl.ElementAt(1).ExtraNumber.Equals(3));
            Assert.That(empl.ElementAt(1).EmploymentType.Equals(3));
            Assert.That(empl.ElementAt(1).IsLeader.Equals(true));
            Assert.That(empl.ElementAt(1).PersonId.Equals(res.ElementAt(1).Id));
            Assert.That(empl.ElementAt(1).Position.Equals("Udvikler"));
        }

        [Test]
        public void EmployeeWithNo_Email_ShouldSetEmailToBlank()
        {
            _dataProvider.GetEmployeesAsQueryable().Returns(new List<Employee>()
            {
                new Employee()
                {
                    Adresse = "Jens Baggesens Vej 44",
                    AnsaettelsesDato = new DateTime(2015,4,28),
                    By = "Aarhus V",
                    CPR = "123456781234",
                    Fornavn = "Jacob Overgaard",
                    Efternavn = "Jensen",
                    Land = "DK",
                    Leder = false,
                    MaNr = 1,
                    PostNr = 8210,
                    Stillingsbetegnelse = "Udvikler",
                    AnsatForhold = "0",
                    LOSOrgId = 1,
                    Stednavn = "",
                    EkstraCiffer = 1
                },
                new Employee()
                {
                    Adresse = "Katrinebjergvej 93b",
                    AnsaettelsesDato = new DateTime(2015,4,28),
                    By = "Aarhus N",
                    CPR = "123456781234",
                    Fornavn = "Morten",
                    Efternavn = "Rasmussen",
                    Land = "DK",
                    Leder = true,
                    MaNr = 2,
                    PostNr = 8200,
                    Stillingsbetegnelse = "Udvikler",
                    AnsatForhold = "3",
                    LOSOrgId = 1,
                    Stednavn = "",
                    EkstraCiffer = 3,
                    
                }
            }.AsQueryable());

            _uut.MigrateEmployees();
            var res = _personRepoMock.AsQueryable();
            var empl = _emplRepoMock.AsQueryable();

            _personRepoMock.ReceivedWithAnyArgs().Insert(new Person());
            _emplRepoMock.ReceivedWithAnyArgs().Insert(new Employment());
            Assert.That(res.ElementAt(0).Initials.Equals(" "));
            Assert.That(res.ElementAt(0).FirstName.Equals("Jacob Overgaard"));
            Assert.That(res.ElementAt(0).LastName.Equals("Jensen"));
            Assert.That(res.ElementAt(0).CprNumber.Equals("123456781234"));
            Assert.That(res.ElementAt(0).IsAdmin.Equals(false));
            Assert.That(res.ElementAt(0).Mail.Equals(""));
            Assert.That(res.ElementAt(0).PersonId.Equals(1));
            Assert.That(res.ElementAt(0).RecieveMail.Equals(false));

            Assert.That(empl.ElementAt(0).OrgUnitId.Equals(1));
            Assert.That(empl.ElementAt(0).StartDateTimestamp.Equals(1430179200));
            Assert.That(empl.ElementAt(0).EndDateTimestamp.Equals(0));
            Assert.That(empl.ElementAt(0).ExtraNumber.Equals(1));
            Assert.That(empl.ElementAt(0).EmploymentType.Equals(0));
            Assert.That(empl.ElementAt(0).IsLeader.Equals(false));
            Assert.That(empl.ElementAt(0).PersonId.Equals(res.ElementAt(0).Id));
            Assert.That(empl.ElementAt(0).Position.Equals("Udvikler"));

            Assert.That(res.ElementAt(1).Initials.Equals(" "));
            Assert.That(res.ElementAt(1).FirstName.Equals("Morten"));
            Assert.That(res.ElementAt(1).LastName.Equals("Rasmussen"));
            Assert.That(res.ElementAt(1).CprNumber.Equals("123456781234"));
            Assert.That(res.ElementAt(1).IsAdmin.Equals(false));
            Assert.That(res.ElementAt(1).Mail.Equals(""));
            Assert.That(res.ElementAt(1).PersonId.Equals(2));
            Assert.That(res.ElementAt(1).RecieveMail.Equals(false));

            Assert.That(empl.ElementAt(1).OrgUnitId.Equals(1));
            Assert.That(empl.ElementAt(1).StartDateTimestamp.Equals(1430179200));
            Assert.That(empl.ElementAt(1).EndDateTimestamp.Equals(0));
            Assert.That(empl.ElementAt(1).ExtraNumber.Equals(3));
            Assert.That(empl.ElementAt(1).EmploymentType.Equals(3));
            Assert.That(empl.ElementAt(1).IsLeader.Equals(true));
            Assert.That(empl.ElementAt(1).PersonId.Equals(res.ElementAt(1).Id));
            Assert.That(empl.ElementAt(1).Position.Equals("Udvikler"));
        }

        [Test]
        public void EmployeeWithNo_Position_ShouldSetPositionToBlank()
        {
            _dataProvider.GetEmployeesAsQueryable().Returns(new List<Employee>()
            {
                new Employee()
                {
                    Adresse = "Jens Baggesens Vej 44",
                    AnsaettelsesDato = new DateTime(2015,4,28),
                    By = "Aarhus V",
                    CPR = "123456781234",
                    Fornavn = "Jacob Overgaard",
                    Efternavn = "Jensen",
                    Land = "DK",
                    Leder = false,
                    MaNr = 1,
                    PostNr = 8210,
                    AnsatForhold = "0",
                    LOSOrgId = 1,
                    Stednavn = "",
                    EkstraCiffer = 1
                },
                new Employee()
                {
                    Adresse = "Katrinebjergvej 93b",
                    AnsaettelsesDato = new DateTime(2015,4,28),
                    By = "Aarhus N",
                    CPR = "123456781234",
                    Fornavn = "Morten",
                    Efternavn = "Rasmussen",
                    Land = "DK",
                    Leder = true,
                    MaNr = 2,
                    PostNr = 8200,
                    AnsatForhold = "3",
                    LOSOrgId = 1,
                    Stednavn = "",
                    EkstraCiffer = 3,
                    
                }
            }.AsQueryable());

            _uut.MigrateEmployees();
            var res = _personRepoMock.AsQueryable();
            var empl = _emplRepoMock.AsQueryable();

            _personRepoMock.ReceivedWithAnyArgs().Insert(new Person());
            _emplRepoMock.ReceivedWithAnyArgs().Insert(new Employment());
            Assert.That(res.ElementAt(0).Initials.Equals(" "));
            Assert.That(res.ElementAt(0).FirstName.Equals("Jacob Overgaard"));
            Assert.That(res.ElementAt(0).LastName.Equals("Jensen"));
            Assert.That(res.ElementAt(0).CprNumber.Equals("123456781234"));
            Assert.That(res.ElementAt(0).IsAdmin.Equals(false));
            Assert.That(res.ElementAt(0).Mail.Equals(""));
            Assert.That(res.ElementAt(0).PersonId.Equals(1));
            Assert.That(res.ElementAt(0).RecieveMail.Equals(false));

            Assert.That(empl.ElementAt(0).OrgUnitId.Equals(1));
            Assert.That(empl.ElementAt(0).StartDateTimestamp.Equals(1430179200));
            Assert.That(empl.ElementAt(0).EndDateTimestamp.Equals(0));
            Assert.That(empl.ElementAt(0).ExtraNumber.Equals(1));
            Assert.That(empl.ElementAt(0).EmploymentType.Equals(0));
            Assert.That(empl.ElementAt(0).IsLeader.Equals(false));
            Assert.That(empl.ElementAt(0).PersonId.Equals(res.ElementAt(0).Id));
            Assert.That(empl.ElementAt(0).Position.Equals(""));

            Assert.That(res.ElementAt(1).Initials.Equals(" "));
            Assert.That(res.ElementAt(1).FirstName.Equals("Morten"));
            Assert.That(res.ElementAt(1).LastName.Equals("Rasmussen"));
            Assert.That(res.ElementAt(1).CprNumber.Equals("123456781234"));
            Assert.That(res.ElementAt(1).IsAdmin.Equals(false));
            Assert.That(res.ElementAt(1).Mail.Equals(""));
            Assert.That(res.ElementAt(1).PersonId.Equals(2));
            Assert.That(res.ElementAt(1).RecieveMail.Equals(false));

            Assert.That(empl.ElementAt(1).OrgUnitId.Equals(1));
            Assert.That(empl.ElementAt(1).StartDateTimestamp.Equals(1430179200));
            Assert.That(empl.ElementAt(1).EndDateTimestamp.Equals(0));
            Assert.That(empl.ElementAt(1).ExtraNumber.Equals(3));
            Assert.That(empl.ElementAt(1).EmploymentType.Equals(3));
            Assert.That(empl.ElementAt(1).IsLeader.Equals(true));
            Assert.That(empl.ElementAt(1).PersonId.Equals(res.ElementAt(1).Id));
            Assert.That(empl.ElementAt(1).Position.Equals(""));
        }

        [Test]
        public void EmployeeWithNo_ExtraNumber_ShouldSetExtraNumberTo0()
        {
            _dataProvider.GetEmployeesAsQueryable().Returns(new List<Employee>()
            {
                new Employee()
                {
                    Adresse = "Jens Baggesens Vej 44",
                    AnsaettelsesDato = new DateTime(2015,4,28),
                    By = "Aarhus V",
                    CPR = "123456781234",
                    Fornavn = "Jacob Overgaard",
                    Efternavn = "Jensen",
                    Land = "DK",
                    Leder = false,
                    MaNr = 1,
                    PostNr = 8210,
                    AnsatForhold = "0",
                    LOSOrgId = 1,
                    Stednavn = "",
                },
                new Employee()
                {
                    Adresse = "Katrinebjergvej 93b",
                    AnsaettelsesDato = new DateTime(2015,4,28),
                    By = "Aarhus N",
                    CPR = "123456781234",
                    Fornavn = "Morten",
                    Efternavn = "Rasmussen",
                    Land = "DK",
                    Leder = true,
                    MaNr = 2,
                    PostNr = 8200,
                    AnsatForhold = "3",
                    LOSOrgId = 1,
                    Stednavn = "",                   
                }
            }.AsQueryable());

            _uut.MigrateEmployees();
            var res = _personRepoMock.AsQueryable();
            var empl = _emplRepoMock.AsQueryable();

            _personRepoMock.ReceivedWithAnyArgs().Insert(new Person());
            _emplRepoMock.ReceivedWithAnyArgs().Insert(new Employment());
            Assert.That(res.ElementAt(0).Initials.Equals(" "));
            Assert.That(res.ElementAt(0).FirstName.Equals("Jacob Overgaard"));
            Assert.That(res.ElementAt(0).LastName.Equals("Jensen"));
            Assert.That(res.ElementAt(0).CprNumber.Equals("123456781234"));
            Assert.That(res.ElementAt(0).IsAdmin.Equals(false));
            Assert.That(res.ElementAt(0).Mail.Equals(""));
            Assert.That(res.ElementAt(0).PersonId.Equals(1));
            Assert.That(res.ElementAt(0).RecieveMail.Equals(false));

            Assert.That(empl.ElementAt(0).OrgUnitId.Equals(1));
            Assert.That(empl.ElementAt(0).StartDateTimestamp.Equals(1430179200));
            Assert.That(empl.ElementAt(0).EndDateTimestamp.Equals(0));
            Assert.That(empl.ElementAt(0).ExtraNumber.Equals(0));
            Assert.That(empl.ElementAt(0).EmploymentType.Equals(0));
            Assert.That(empl.ElementAt(0).IsLeader.Equals(false));
            Assert.That(empl.ElementAt(0).PersonId.Equals(res.ElementAt(0).Id));
            Assert.That(empl.ElementAt(0).Position.Equals(""));

            Assert.That(res.ElementAt(1).Initials.Equals(" "));
            Assert.That(res.ElementAt(1).FirstName.Equals("Morten"));
            Assert.That(res.ElementAt(1).LastName.Equals("Rasmussen"));
            Assert.That(res.ElementAt(1).CprNumber.Equals("123456781234"));
            Assert.That(res.ElementAt(1).IsAdmin.Equals(false));
            Assert.That(res.ElementAt(1).Mail.Equals(""));
            Assert.That(res.ElementAt(1).PersonId.Equals(2));
            Assert.That(res.ElementAt(1).RecieveMail.Equals(false));

            Assert.That(empl.ElementAt(1).OrgUnitId.Equals(1));
            Assert.That(empl.ElementAt(1).StartDateTimestamp.Equals(1430179200));
            Assert.That(empl.ElementAt(1).EndDateTimestamp.Equals(0));
            Assert.That(empl.ElementAt(1).ExtraNumber.Equals(0));
            Assert.That(empl.ElementAt(1).EmploymentType.Equals(3));
            Assert.That(empl.ElementAt(1).IsLeader.Equals(true));
            Assert.That(empl.ElementAt(1).PersonId.Equals(res.ElementAt(1).Id));
            Assert.That(empl.ElementAt(1).Position.Equals(""));
        }

    }
}
