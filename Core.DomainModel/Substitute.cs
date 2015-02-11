﻿using System;
using System.Collections.Generic;

namespace Core.DomainModel
{
    public class Substitute
    {
        public int Id { get; set; }
        public long StartDateTimestamp { get; set; }
        public long EndDateTimestamp { get; set; }

        public int LeaderId { get; set; }
        public virtual Person Leader { get; set; }
        public int SubId { get; set; }
        public virtual Person Sub { get; set; }
        public virtual ICollection<Person> Persons { get; set; }
        public int OrgUnitId { get; set; }
        public virtual OrgUnit OrgUnit{ get; set; }
    }
}
