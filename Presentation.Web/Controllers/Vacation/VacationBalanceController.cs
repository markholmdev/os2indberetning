﻿using System;
using System.Linq;
using System.Web.Http;
using System.Web.OData;
using System.Web.OData.Query;
using Core.DomainModel;
using Core.DomainServices;
using Core.ApplicationServices.Logger;

namespace OS2Indberetning.Controllers.Vacation
{
    public class VacationBalanceController : BaseController<VacationBalance>
    {
        private readonly ILogger _logger;

        public VacationBalanceController(IGenericRepository<VacationBalance> repo, IGenericRepository<Person> personRepo, ILogger logger) : base(repo, personRepo)
        {
            _logger = logger;
        }

        // GET: odata/VacationBalance
        [EnableQuery]
        public IQueryable<VacationBalance> Get(ODataQueryOptions<VacationBalance> queryOptions)
        {
            _logger.Log($"VacationBalanceController, Get(). Initial", "web", 3);

            try
            {
                if (Repo.AsQueryable().Count() > 0)
                {
                    var currentTimestamp = (Int32)(DateTime.UtcNow.Subtract(new DateTime(1970, 1, 1))).TotalSeconds;
                    var currentYear = Repo.AsQueryable().Max(y => y.Year);
                    var queryable =
                        GetQueryable(queryOptions)
                            .Where(x => x.PersonId == CurrentUser.Id && x.Year == currentYear && (x.Employment.EndDateTimestamp == 0 || x.Employment.EndDateTimestamp >= currentTimestamp));

                    return queryable;
                }
            }
            catch (Exception ex)
            {
                _logger.Log($"VacationBalanceController, Get(). Exception={ex.Message}", "web", 3);
            }
            _logger.Log($"VacationBalanceController, Get(). End", "web", 3);
            return Repo.AsQueryable();
        }


        //GET: odata/VacationBalance(5)
        public IQueryable<VacationBalance> Get([FromODataUri] int key, ODataQueryOptions<VacationBalance> queryOptions)
        {
            var res = GetQueryable(key, queryOptions);
            return res;
        }

        // PUT: odata/VacationBalance(5)
        /// <summary>
        /// Not implemented.
        /// </summary>
        /// <param name="key"></param>
        /// <param name="delta"></param>
        /// <returns></returns>
        public new IHttpActionResult Put([FromODataUri] int key, Delta<VacationBalance> delta)
        {
            throw new NotSupportedException();
        }

        // POST: odata/VacationBalance
        [EnableQuery]
        public IHttpActionResult Post(VacationBalance vacationBalance, string emailText)
        {
            throw new NotSupportedException();
        }

        // PATCH: odata/VacationBalance(6)
        [EnableQuery]
        [AcceptVerbs("PATCH", "MERGE")]
        public IHttpActionResult Patch([FromODataUri] int key, Delta<VacationBalance> delta, string emailText)
        {
            throw new NotSupportedException();
        }

        // DELETE: odata/VacationBalance(5)
        public new IHttpActionResult Delete([FromODataUri] int key)
        {
            throw new NotSupportedException();
        }
    }
}
