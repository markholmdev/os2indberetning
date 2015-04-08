﻿angular.module("application").controller("ApproveReportsSettingsController", [
   "$scope", "OrgUnit", "Person", "$modal", function ($scope, OrgUnit, Person, $modal) {
       $scope.collapseSubtitute = false;
       $scope.collapsePersonalApprover = false;
       $scope.orgUnits = [];
       $scope.persons = [];
       $scope.currentPerson = {};

       var personId = 1;

       Person.get({ id: personId }, function (data) {
           $scope.currentPerson = data;
       });

       Person.getAll(function (data) {
           $scope.persons = data.value;
       });

       OrgUnit.get(function (data) {
           $scope.orgUnits = data.value;
       });




       $scope.substituteOrgUnit = "";



       $scope.loadGrids = function () {
           $scope.substitutes = {
               dataSource: {
                   type: "odata",
                   transport: {
                       read: {
                           beforeSend: function (req) {
                               req.setRequestHeader('Accept', 'application/json;odata=fullmetadata');
                           },
                           url: "odata/Substitutes/Service.Substitute?$expand=OrgUnit,Sub,Person,Leader &$filter=PersonId eq " + personId,
                           dataType: "json",
                           cache: false
                       },
                       parameterMap: function (options, type) {
                           var d = kendo.data.transports.odata.parameterMap(options);

                           delete d.$inlinecount; // <-- remove inlinecount parameter                                                        

                           d.$count = true;

                           return d;
                       }
                   },
                   pageSize: 20,
                   schema: {
                       data: function (data) {
                           return data.value; // <-- The result is just the data, it doesn't need to be unpacked.
                       },
                       total: function (data) {
                           return data['@odata.count']; // <-- The total items count is the data length, there is no .Count to unpack.
                       }
                   }
               },
               sortable: true,
               pageable: {
                   messages: {
                       display: "{0} - {1} af {2} ", //{0} is the index of the first record on the page, {1} - index of the last record on the page, {2} is the total amount of records
                       empty: "Ingen stedfortrædere at vise",
                       page: "Side",
                       of: "af {0}", //{0} is total amount of pages
                       itemsPerPage: "stedfortrædere pr. side",
                       first: "Gå til første side",
                       previous: "Gå til forrige side",
                       next: "Gå til næste side",
                       last: "Gå til sidste side",
                       refresh: "Genopfrisk",
                   },
                   pageSizes: [5, 10, 20, 30, 40, 50]
               },
               dataBound: function () {
                   this.expandRow(this.tbody.find("tr.k-master-row").first());
               },
               columns: [{
                   field: "Sub.FullName",
                   title: "Stedfortræder"
               },
               {
                   field: "Person.FullName",
                   title: "Stedfortræder for"
               }, {
                   field: "OrgUnit.ShortDescription",
                   title: "Organisationsenhed",
               }, {
                   field: "Leader.FullName",
                   title: "Opsat af"
               }, {
                   field: "StartDateTimestamp",
                   title: "Fra",
                   template: function (data) {
                       var m = moment.unix(data.StartDateTimestamp);
                       return m._d.getDate() + "/" +
                           (m._d.getMonth() + 1) + "/" + // +1 because getMonth is zero indexed.
                           m._d.getFullYear();
                   }
               }, {
                   title: "Til",
                   field: "EndDateTimestamp",
                   template: function (data) {
                       if (data.EndDateTimestamp == 9999999999) {
                           return "Tidsubegrænset";
                       }
                       var m = moment.unix(data.EndDateTimestamp);
                       return m._d.getDate() + "/" +
                           (m._d.getMonth() + 1) + "/" + // +1 because getMonth is zero indexed.
                           m._d.getFullYear();
                   }
               }, {
                   title: "Muligheder",
                   template: "<a ng-click='openEditSubstitute(${Id})'>Rediger</a> | <a ng-click='openDeleteSubstitute(${Id})'>Slet</a>"
               }],
               scrollable: false
           };

           $scope.personalApprovers = {
               dataSource: {
                   type: "odata",
                   transport: {
                       read: {
                           beforeSend: function (req) {
                               req.setRequestHeader('Accept', 'application/json;odata=fullmetadata');
                           },
                           url: "odata/Substitutes/Service.Personal?$expand=OrgUnit,Sub,Leader,Person&$filter=LeaderId eq " + personId,
                           dataType: "json",
                           cache: false
                       },
                       parameterMap: function (options, type) {
                           var d = kendo.data.transports.odata.parameterMap(options);

                           delete d.$inlinecount; // <-- remove inlinecount parameter                                                        

                           d.$count = true;

                           return d;
                       }
                   },
                   pageSize: 20,
                   schema: {
                       data: function (data) {
                           return data.value; // <-- The result is just the data, it doesn't need to be unpacked.
                       },
                       total: function (data) {
                           return data['@odata.count']; // <-- The total items count is the data length, there is no .Count to unpack.
                       }
                   },
               },

               sortable: true,
               pageable: {
                   messages: {
                       display: "{0} - {1} af {2} ", //{0} is the index of the first record on the page, {1} - index of the last record on the page, {2} is the total amount of records
                       empty: "Ingen personlige godkendere at vise",
                       page: "Side",
                       of: "af {0}", //{0} is total amount of pages
                       itemsPerPage: "personlige godkendere pr. side",
                       first: "Gå til første side",
                       previous: "Gå til forrige side",
                       next: "Gå til næste side",
                       last: "Gå til sidste side",
                       refresh: "Genopfrisk",
                   },
                   pageSizes: [5, 10, 20, 30, 40, 50]
               },
               dataBound: function () {
                   this.expandRow(this.tbody.find("tr.k-master-row").first());
               },
               columns: [{
                   field: "Sub.FullName",
                   title: "Godkender"
               }, {
                   field: "Person.FullName",
                   title: "Godkender for"
               }, {
                   field: "Leader.FullName",
                   title: "Opsat af"
               }, {
                   field: "StartDateTimestamp",
                   title: "Fra",
                   template: function (data) {
                       var m = moment.unix(data.StartDateTimestamp);
                       return m._d.getDate() + "/" +
                           (m._d.getMonth() + 1) + "/" + // +1 because getMonth is zero indexed.
                           m._d.getFullYear();
                   },
               }, {
                   field: "EndDateTimestamp",
                   title: "Til",
                   template: function (data) {
                       if (data.EndDateTimestamp == 9999999999) {
                           return "Tidsubegrænset";
                       }
                       var m = moment.unix(data.EndDateTimestamp);
                       return m._d.getDate() + "/" +
                           (m._d.getMonth() + 1) + "/" + // +1 because getMonth is zero indexed.
                           m._d.getFullYear();
                   },
               }, {
                   title: "Muligheder",
                   template: "<a ng-click='openEditApprover(${Id})'>Rediger</a> | <a ng-click='openDeleteApprover(${Id})'>Slet</a>"
               }],
               scrollable: false
           };

           $scope.mySubstitutes = {
               dataSource: {
                   type: "odata",
                   transport: {
                       read: {
                           beforeSend: function (req) {
                               req.setRequestHeader('Accept', 'application/json;odata=fullmetadata');
                           },
                           url: "odata/Substitutes?$expand=Sub,Person,Leader,OrgUnit &$filter=PersonId eq LeaderId and SubId eq " + personId,
                           dataType: "json",
                           cache: false
                       },
                       parameterMap: function (options, type) {
                           var d = kendo.data.transports.odata.parameterMap(options);

                           delete d.$inlinecount; // <-- remove inlinecount parameter                                                        

                           d.$count = true;

                           return d;
                       }
                   },
                   pageSize: 20,
                   schema: {
                       data: function (data) {
                           return data.value; // <-- The result is just the data, it doesn't need to be unpacked.
                       },
                       total: function (data) {
                           return data['@odata.count']; // <-- The total items count is the data length, there is no .Count to unpack.
                       }
                   }
               },
               sortable: true,
               pageable: {
                   messages: {
                       display: "{0} - {1} af {2} ", //{0} is the index of the first record on the page, {1} - index of the last record on the page, {2} is the total amount of records
                       empty: "Ingen stedfortrædere at vise",
                       page: "Side",
                       of: "af {0}", //{0} is total amount of pages
                       itemsPerPage: "stedfortrædere pr. side",
                       first: "Gå til første side",
                       previous: "Gå til forrige side",
                       next: "Gå til næste side",
                       last: "Gå til sidste side",
                       refresh: "Genopfrisk",
                   },
                   pageSizes: [5, 10, 20, 30, 40, 50]
               },
               dataBound: function () {
                   this.expandRow(this.tbody.find("tr.k-master-row").first());
               },
               columns: [
               {
                   field: "Sub.FullName",
                   title: "Stedfortræder"
               },
               {
                   field: "Person.FullName",
                   title: "Stedfortræder for"
               }, {
                   field: "OrgUnit.ShortDescription",
                   title: "Organisationsenhed",
               }, {
                   field: "Leader.FullName",
                   title: "Opsat af"
               }, {
                   field: "StartDateTimestamp",
                   title: "Fra",
                   template: function (data) {
                       var m = moment.unix(data.StartDateTimestamp);
                       return m._d.getDate() + "/" +
                           (m._d.getMonth() + 1) + "/" + // +1 because getMonth is zero indexed.
                           m._d.getFullYear();
                   }
               }, {
                   title: "Til",
                   field: "EndDateTimestamp",
                   template: function (data) {
                       if (data.EndDateTimestamp == 9999999999) {
                           return "Tidsubegrænset";
                       }
                       var m = moment.unix(data.EndDateTimestamp);
                       return m._d.getDate() + "/" +
                           (m._d.getMonth() + 1) + "/" + // +1 because getMonth is zero indexed.
                           m._d.getFullYear();
                   }
               }],
               scrollable: false
           };

       }

       $scope.loadGrids();

       $scope.openDeleteApprover = function (id) {
           var modalInstance = $modal.open({
               templateUrl: 'App/ApproveReports/Modals/ConfirmDeleteApproverModal.html',
               controller: 'ConfirmDeleteApproverModalInstanceController',
               backdrop: 'static',
               size: 'lg',
               resolve: {
                   persons: function () {
                       return $scope.persons;
                   },
                   orgUnits: function () {
                       return $scope.orgUnits;
                   },
                   leader: function () {
                       return $scope.currentPerson;
                   },
                   substituteId: function () {
                       return id;
                   }
               }
           });

           modalInstance.result.then(function () {
               $scope.refreshGrids();
           }, function () {

           });
       }

       $scope.openDeleteSubstitute = function (id) {
           var modalInstance = $modal.open({
               templateUrl: 'App/ApproveReports/Modals/ConfirmDeleteSubstituteModal.html',
               controller: 'ConfirmDeleteSubstituteModalInstanceController',
               backdrop: 'static',
               size: 'lg',
               resolve: {
                   persons: function () {
                       return $scope.persons;
                   },
                   orgUnits: function () {
                       return $scope.orgUnits;
                   },
                   leader: function () {
                       return $scope.currentPerson;
                   },
                   substituteId: function () {
                       return id;
                   }
               }
           });

           modalInstance.result.then(function () {
               $scope.refreshGrids();
           }, function () {

           });
       }


       $scope.openEditSubstitute = function (id) {
           var modalInstance = $modal.open({
               templateUrl: 'App/ApproveReports/Modals/editSubstituteModal.html',
               controller: 'EditSubstituteModalInstanceController',
               backdrop: 'static',
               size: 'lg',
               resolve: {
                   persons: function () {
                       return $scope.persons;
                   },
                   orgUnits: function () {
                       return $scope.orgUnits;
                   },
                   leader: function () {
                       return $scope.currentPerson;
                   },
                   substituteId: function () {
                       return id;
                   }
               }
           });

           modalInstance.result.then(function () {
               $scope.refreshGrids();
           }, function () {

           });
       }

       $scope.openEditApprover = function (id) {
           var modalInstance = $modal.open({
               templateUrl: 'App/ApproveReports/Modals/editApproverModal.html',
               controller: 'EditApproverModalInstanceController',
               backdrop: 'static',
               size: 'lg',
               resolve: {
                   persons: function () {
                       return $scope.persons;
                   },
                   orgUnits: function () {
                       return $scope.orgUnits;
                   },
                   leader: function () {
                       return $scope.currentPerson;
                   },
                   substituteId: function () {
                       return id;
                   }
               }
           });

           modalInstance.result.then(function () {
               $scope.refreshGrids();
           }, function () {

           });
       }

       $scope.createNewApprover = function () {
           var modalInstance = $modal.open({
               templateUrl: 'App/ApproveReports/Modals/newApproverModal.html',
               controller: 'NewApproverModalInstanceController',
               backdrop: 'static',
               size: 'lg',
               resolve: {
                   persons: function () {
                       return $scope.persons;
                   },
                   orgUnits: function () {
                       return $scope.orgUnits;
                   },
                   leader: function () {
                       return $scope.currentPerson;
                   }
               }
           });

           modalInstance.result.then(function () {
               $scope.refreshGrids();
           }, function () {

           });
       };

       $scope.createNewSubstitute = function () {
           var modalInstance = $modal.open({
               templateUrl: 'App/ApproveReports/Modals/newSubstituteModal.html',
               controller: 'NewSubstituteModalInstanceController',
               backdrop: 'static',
               size: 'lg',
               resolve: {
                   persons: function () {
                       return $scope.persons;
                   },
                   orgUnits: function () {
                       return $scope.orgUnits;
                   },
                   leader: function () {
                       return $scope.currentPerson;
                   }
               }
           });

           modalInstance.result.then(function () {
               $scope.refreshGrids();
           }, function () {

           });
       };

       $scope.refreshGrids = function () {
           // Below ain't working with angular bindings, or I can't get it to work

           $('#substituteGrid').data('kendoGrid').dataSource.read();
           $("#substituteGrid").data('kendoGrid').refresh();

           $('#personalApproverGrid').data('kendoGrid').dataSource.read();
           $("#personalApproverGrid").data('kendoGrid').refresh();
       }
   }
]);