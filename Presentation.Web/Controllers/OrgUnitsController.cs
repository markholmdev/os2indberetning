﻿using System.Linq;
using System.Web.Http;
using System.Web.OData;
using System.Web.OData.Query;
using Core.DomainModel;

namespace OS2Indberetning.Controllers
{
    public class OrgUnitsController : BaseController<OrgUnit>
    {
        // GET: odata/OrgUnits
        [EnableQuery]
        public IQueryable<OrgUnit> Get(ODataQueryOptions<OrgUnit> queryOptions)
        {
            return GetQueryable(queryOptions);
        }

        //GET: odata/OrgUnits(5)
        public IQueryable<OrgUnit> Get([FromODataUri] int key, ODataQueryOptions<OrgUnit> queryOptions)
        {
            return GetQueryable(key, queryOptions);
        }

        // PUT: odata/OrgUnits(5)
        public new IHttpActionResult Put([FromODataUri] int key, Delta<OrgUnit> delta)
        {
            return base.Put(key, delta);
        }

        // POST: odata/OrgUnits
        [EnableQuery]
        public new IHttpActionResult Post(OrgUnit OrgUnit)
        {
            return base.Post(OrgUnit);
        }

        // PATCH: odata/OrgUnits(5)
        [EnableQuery]
        [AcceptVerbs("PATCH", "MERGE")]
        public new IHttpActionResult Patch([FromODataUri] int key, Delta<OrgUnit> delta)
        {
            return base.Patch(key, delta);
        }

        // DELETE: odata/OrgUnits(5)
        public new IHttpActionResult Delete([FromODataUri] int key)
        {
            return base.Delete(key);
        }
    }
}