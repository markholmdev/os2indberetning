﻿angular.module("application").controller("PendingReportsController", [
   "$scope", "$modal", "$rootScope", "Report", "OrgUnit", "Person", "$timeout", "NotificationService", function ($scope, $modal, $rootScope, Report, OrgUnit, Person, $timeout, NotificationService) {

       // Load people for auto-complete textbox
       $scope.people = [];
       $scope.person = {};
       $scope.orgUnit = {};
       $scope.orgUnits = [];

       $scope.tableSortHelp = $rootScope.HelpTexts.TableSortHelp.text;

       // Set personId. The value on $rootScope is set in resolve in application.js
       var personId = $rootScope.CurrentUser.Id;

       OrgUnit.get().$promise.then(function (res) {
           $scope.orgUnits = res.value;
       });

       $scope.orgUnitChanged = function (item) {
           $scope.applyOrgUnitFilter($scope.orgUnit.chosenUnit);
       }

       $scope.getEndOfDayStamp = function (d) {
           var m = moment(d);
           return m.endOf('day').unix();
       }

       $scope.getStartOfDayStamp = function (d) {
           var m = moment(d);
           return m.startOf('day').unix();
       }

       // dates for kendo filter.
       var fromDateFilter = new Date();
       fromDateFilter.setDate(fromDateFilter.getDate() - 30);
       fromDateFilter = $scope.getStartOfDayStamp(fromDateFilter);
       var toDateFilter = $scope.getEndOfDayStamp(new Date());

       $scope.checkAllBox = {};

       $scope.checkboxes = {};
       $scope.checkboxes.showSubbed = false;

       var checkedReports = [];

       var allReports = [];

       // Helper Methods

       $scope.approveSelectedToolbar = {
           resizable: false,
           items: [

               {
                   type: "splitButton",
                   text: "Godkend markerede",
                   click: approveSelectedClick,
                   menuButtons: [
                       { text: "Godkend markerede med anden kontering", click: approveSelectedWithAccountClick }
                   ]
               }
           ]
       };

       $scope.showSubsChanged = function () {
           /// <summary>
           /// Applies filter according to getReportsWhereSubExists
           /// </summary>
           $scope.gridContainer.grid.dataSource.transport.options.read.url = "/odata/DriveReports?leaderId=" + personId + "&status=Pending" + "&getReportsWhereSubExists=" + $scope.checkboxes.showSubbed + " &$expand=Employment($expand=OrgUnit),DriveReportPoints, ResponsibleLeader";
           $scope.gridContainer.grid.dataSource.read();
       }

       $scope.applyOrgUnitFilter = function (longDescription) {
           /// <summary>
           /// Applies orgunit filter
           /// </summary>
           /// <param name="longDescription">LongDescription of OrgUnit to filter by</param>
           var oldFilters = $scope.gridContainer.grid.dataSource.filter();
           var newFilters = [];


           if (oldFilters == undefined) {
               // If no filters exist, just add the filters.
               if (longDescription != "") {
                   newFilters.push({ field: "Employment.OrgUnit.LongDescription", operator: "eq", value: longDescription });
               }
           } else {
               // If filters already exist then get the old filters, that arent ShortDescription.
               // Then add the new drivedate filters to these.
               angular.forEach(oldFilters.filters, function (value, key) {
                   if (value.field != "Employment.OrgUnit.LongDescription") {
                       newFilters.push(value);
                   }
               });
               if (longDescription != "") {
                   newFilters.push({ field: "Employment.OrgUnit.LongDescription", operator: "eq", value: longDescription });
               }

           }
           $scope.gridContainer.grid.dataSource.filter(newFilters);
       }

       $scope.applyDateFilter = function (fromDateStamp, toDateStamp) {
           /// <summary>
           /// Applies date filter
           /// </summary>
           /// <param name="fromDateStamp"></param>
           /// <param name="toDateStamp"></param>

           var oldFilters = $scope.gridContainer.grid.dataSource.filter();
           var newFilters = [];


           if (oldFilters == undefined) {
               // If no filters exist, just add the filters.
               newFilters.push({ field: "DriveDateTimestamp", operator: "ge", value: fromDateStamp });
               newFilters.push({ field: "DriveDateTimestamp", operator: "le", value: toDateStamp });
           } else {
               // If filters already exist then get the old filters, that arent drivedate.
               // Then add the new drivedate filters to these.
               angular.forEach(oldFilters.filters, function (value, key) {
                   if (value.field != "DriveDateTimestamp") {
                       newFilters.push(value);
                   }
               });
               newFilters.push({ field: "DriveDateTimestamp", operator: "ge", value: fromDateStamp });
               newFilters.push({ field: "DriveDateTimestamp", operator: "le", value: toDateStamp });
           }
           $scope.gridContainer.grid.dataSource.filter(newFilters);
       }

       $scope.applyPersonFilter = function (fullName) {
           /// <summary>
           /// Applies person filter.
           /// </summary>
           /// <param name="fullName"></param>


           var oldFilters = $scope.gridContainer.grid.dataSource.filter();
           var newFilters = [];


           if (oldFilters == undefined) {
               // If no filters exist, just add the filters.
               if (fullName != "") {
                   newFilters.push({ field: "FullName", operator: "eq", value: fullName });
               }
           } else {
               // If filters already exist then get the old filters, that arent drivedate.
               // Then add the new drivedate filters to these.
               angular.forEach(oldFilters.filters, function (value, key) {
                   if (value.field != "FullName") {
                       newFilters.push(value);
                   }
               });
               if (fullName != "") {
                   newFilters.push({ field: "FullName", operator: "eq", value: fullName });
               }

           }
           $scope.gridContainer.grid.dataSource.filter(newFilters);
       }

       $scope.removePersonFilter = function () {
           /// <summary>
           /// Removes person filter.
           /// </summary>
           $scope.person.chosenPerson = "";
           var oldFilters = $scope.gridContainer.grid.dataSource.filter();
           if (oldFilters == undefined) {
               return;
           }

           var newFilters = [];
           angular.forEach(oldFilters.filters, function (value, key) {
               if (value.field != "FullName") {
                   newFilters.push(value);
               }
           });
           $scope.gridContainer.grid.dataSource.filter(newFilters);
       }

       $scope.removeDateFilter = function () {
           /// <summary>
           /// Removes date filter.
           /// </summary>
           $scope.loadInitialDates();
           var oldFilters = $scope.gridContainer.grid.dataSource.filter();
           if (oldFilters == undefined) {
               return;
           }
           var newFilters = [];
           angular.forEach(oldFilters.filters, function (value, key) {
               if (value.field != "DriveDateTimestamp") {
                   newFilters.push(value);
               }
           });
           $scope.gridContainer.grid.dataSource.filter(newFilters);
       }

       $scope.removeOrgUnitFilter = function () {
           /// <summary>
           /// Removes OrgUnit filter.
           /// </summary>
           $scope.orgUnit.chosenUnit = "";
           var oldFilters = $scope.gridContainer.grid.dataSource.filter();
           if (oldFilters == undefined) {
               return;
           }
           var newFilters = [];
           angular.forEach(oldFilters.filters, function (value, key) {
               if (value.field != "Employment.OrgUnit.LongDescription") {
                   newFilters.push(value);
               }
           });
           $scope.gridContainer.grid.dataSource.filter(newFilters);
       }

       $scope.reports = {
           dataSource:
           {
               type: "odata-v4",
               transport: {
                   read: {
                       url: "/odata/DriveReports?leaderId=" + personId + "&status=Pending" + "&getReportsWhereSubExists=" + $scope.checkboxes.showSubbed + " &$expand=Employment($expand=OrgUnit),DriveReportPoints, ResponsibleLeader",
                   },

               },
               schema: {
                   data: function (data) {
                       allReports = data.value;
                       return data.value;
                   },
               },
               pageSize: 20,
               serverPaging: true,
               serverAggregates: false,
               serverSorting: true,
               serverFiltering: true,
               filter: [{ field: "DriveDateTimestamp", operator: "gte", value: fromDateFilter }, { field: "DriveDateTimestamp", operator: "lte", value: toDateFilter }],
               sort: [{ field: "FullName", dir: "desc" }, { field: "DriveDateTimestamp", dir: "desc" }],
               aggregate: [
                   { field: "Distance", aggregate: "sum" },
                   { field: "AmountToReimburse", aggregate: "sum" },
               ]
           },

           sortable: { mode: "multiple" },
           resizable: true,
           pageable: {
               messages: {
                   display: "{0} - {1} af {2} indberetninger", //{0} is the index of the first record on the page, {1} - index of the last record on the page, {2} is the total amount of records
                   empty: "Ingen indberetninger at vise",
                   page: "Side",
                   of: "af {0}", //{0} is total amount of pages
                   itemsPerPage: "indberetninger pr. side",
                   first: "Gå til første side",
                   previous: "Gå til forrige side",
                   next: "Gå til næste side",
                   last: "Gå til sidste side",
                   refresh: "Genopfrisk",
               },
               pageSizes: [5, 10, 20, 30, 40, 50]
           },
           scrollable: false,
           dataBinding: function () {
               checkedReports = [];
               $scope.checkAllBox.isChecked = false;
               var temp = $scope.checkboxes.showSubbed;
               $scope.checkboxes = {};
               $scope.checkboxes.showSubbed = temp;
           },
           dataBound: function () {
               this.expandRow(this.tbody.find("tr.k-master-row").first());
           },
           columns: [
           {
               field: "FullName",
               title: "Medarbejder"
           }, {
               field: "Employment.OrgUnit.LongDescription",
               title: "Organisationsenhed"
           }, {
               field: "DriveDateTimestamp",
               template: function (data) {
                   var m = moment.unix(data.DriveDateTimestamp);
                   return m._d.getDate() + "/" +
                       (m._d.getMonth() + 1) + "/" + // +1 because getMonth is zero indexed.
                       m._d.getFullYear();
               },
               title: "Kørselsdato"
           }, {
               field: "Purpose",
               title: "Formål",
           }, {
               title: "Rute",
               field: "DriveReportPoints",
               template: function (data) {
                   var tooltipContent = "";
                   var gridContent = "";
                   angular.forEach(data.DriveReportPoints, function (point, key) {
                       if (key != data.DriveReportPoints.length - 1) {
                           tooltipContent += point.StreetName + " " + point.StreetNumber + ", " + point.ZipCode + " " + point.Town + "<br/>";
                           gridContent += point.Town + "<br/>";
                       } else {
                           tooltipContent += point.StreetName + " " + point.StreetNumber + ", " + point.ZipCode + " " + point.Town;
                           gridContent += point.Town;
                       }
                   });
                   var result = "<div kendo-tooltip k-content=\"'" + tooltipContent + "'\">" + gridContent + "</div> <a ng-click='showRouteModal(" + data.Id + ")'>Se rute på kort</a>";

                   if (data.KilometerAllowance != "Read") {
                       return result;
                   } else {
                       if (data.IsFromApp) {
                           return "<div kendo-tooltip k-content=\"'" + data.UserComment + "'\">Indberettet fra mobil app</div> <a ng-click='showRouteModal(" + data.Id + ")'>Se rute på kort</a>";
                       } else {
                           return "<div kendo-tooltip k-content=\"'" + data.UserComment + "'\">Aflæst manuelt</div>";
                       }

                   }
               }
           }, {
               field: "Distance",
               title: "Afstand",
               template: function (data) {
                   return data.Distance.toFixed(2).toString().replace('.', ',') + " Km.";
               },
               footerTemplate: "Total: #= kendo.toString(sum, '0.00').replace('.',',') # Km"
           }, {
               field: "AmountToReimburse",
               title: "Beløb",
               template: function (data) {
                   return data.AmountToReimburse.toFixed(2).toString().replace('.', ',') + " Dkk.";
               },
               footerTemplate: "Total: #= kendo.toString(sum, '0.00').replace('.',',') # Dkk"
           }, {
               field: "KilometerAllowance",
               title: "Merkørsel",
               template: function (data) {
                   if (data.KilometerAllowance == "CalculatedWithoutExtraDistance") {
                       return "<i class='fa fa-check'></i>";
                   }
                   return "";
               }
           }, {
               field: "FourKmRule",
               title: "4 km",
               template: function (data) {
                   if (data.FourKmRule) {
                       return "<i class='fa fa-check'></i>";
                   }
                   return "";
               }
           }, {
               field: "CreatedDateTimestamp",
               title: "Indberetningsdato",
               template: function (data) {
                   var m = moment.unix(data.CreatedDateTimestamp);
                   return m._d.getDate() + "/" +
                       (m._d.getMonth() + 1) + "/" + // +1 because getMonth is zero indexed.
                       m._d.getFullYear();
               },
           }, {
               sortable: false,
               field: "Id",
               template: function (data) {
                   if (data.ResponsibleLeader.Id == data.PersonId) {
                       return "Indberetning skal godkendes af din leder eller opsat personlig godkender.";
                   }
                   if (data.ResponsibleLeader.Id == $rootScope.CurrentUser.Id) {
                       return "<a ng-click=approveClick(" + data.Id + ")>Godkend</a> | <a ng-click=rejectClick(" + data.Id + ")>Afvis</a> <div class='col-md-1 pull-right'><input type='checkbox' ng-model='checkboxes[" + data.Id + "]' ng-change='rowChecked(" + data.Id + ")'></input></div>";
                   } else {
                       return data.ResponsibleLeader.FullName + " er udpeget som godkender.";
                   }

               },
               headerTemplate: "Muligheder <div class='col-sm-1 pull-right'><input ng-change='checkAllBoxesOnPage()' type='checkbox' ng-model='checkAllBox.isChecked'></input></div>",
               footerTemplate: "<div class='pull-right fill-width' kendo-toolbar k-options='approveSelectedToolbar'></div>"
           }
           ],
       };

       $scope.checkAllBoxesOnPage = function () {
           /// <summary>
           /// Checks all reports on the current page.
           /// </summary>
           if ($scope.checkAllBox.isChecked) {
               checkedReports = [];
               angular.forEach(allReports, function (value, key) {
                   var repId = value.Id;
                   $scope.checkboxes[repId] = true;
                   checkedReports.push(repId);
               });
           } else {
               angular.forEach(allReports, function (value, key) {
                   var repId = value.Id;
                   $scope.checkboxes[repId] = false;
                   var index = checkedReports.indexOf(repId);
                   checkedReports.splice(index, 1);
               });
           }
       }

       $scope.rowChecked = function (id) {
           /// <summary>
           /// Adds id of the report in the checkedrow to checkedReports.
           /// </summary>
           /// <param name="id"></param>
           if ($scope.checkboxes[id]) {
               // Is run if the checkbox has been checked.
               checkedReports.push(id);
           } else {
               // Is run of the checkbox has been unchecked
               var index = checkedReports.indexOf(id);
               checkedReports.splice(index, 1);
           }
       }



       $scope.loadInitialDates = function () {
           /// <summary>
           /// Loads initial date filters.
           /// </summary>
           // Set initial values for kendo datepickers.

           initialLoad = 2;

           var from = new Date();
           from.setDate(from.getDate() - 30);

           $scope.dateContainer.toDate = new Date();
           $scope.dateContainer.fromDate = from;


       }





       // Event handlers



       $scope.clearName = function () {
           $scope.chosenPerson = "";
       }

       $scope.clearClicked = function () {
           /// <summary>
           /// Clears filters.
           /// </summary>
           $scope.loadInitialDates();
           $scope.removeDateFilter();
           $scope.removePersonFilter();
           $scope.removeOrgUnitFilter();
       }

       $scope.approveClick = function (id) {
           /// <summary>
           /// Opens approve report modal.
           /// </summary>
           /// <param name="id"></param>
           var modalInstance = $modal.open({
               templateUrl: '/App/ApproveReports/Modals/ConfirmApproveTemplate.html',
               controller: 'AcceptController',
               backdrop: "static",
               resolve: {
                   itemId: function () {
                       return id;
                   },
                   pageNumber: -1
               }
           });

           modalInstance.result.then(function () {
               Report.patch({ id: id }, {
                   "Status": "Accepted",
                   "ClosedDateTimestamp": moment().unix(),
                   "ApprovedById": $rootScope.CurrentUser.Id,
               }, function () {
                   $scope.gridContainer.grid.dataSource.read();
               });
           });
       }

       function approveSelectedWithAccountClick() {
           /// <summary>
           /// Opens approve selected reports with different account modal.
           /// </summary>
           if (checkedReports.length == 0) {
               NotificationService.AutoFadeNotification("danger", "", "Ingen indberetninger er markerede!");
           } else {
               var modalInstance = $modal.open({
                   templateUrl: '/App/ApproveReports/Modals/ConfirmApproveSelectedWithAccountTemplate.html',
                   controller: 'AcceptWithAccountController',
                   backdrop: "static",
                   resolve: {
                       itemId: function () {
                           return -1;
                       },
                       pageNumber: -1
                   }
               });

               modalInstance.result.then(function (accountNumber) {
                   angular.forEach(checkedReports, function (value, key) {
                       Report.patch({ id: value }, {
                           "Status": "Accepted",
                           "ClosedDateTimestamp": moment().unix(),
                           "AccountNumber": accountNumber,
                           "ApprovedById": $rootScope.CurrentUser.Id,
                       }, function () {
                           $scope.gridContainer.grid.dataSource.read();
                       });
                   });
                   checkedReports = [];
               });
           }
       }

       function approveSelectedClick() {
           /// <summary>
           /// Opens approve selected reports modal.
           /// </summary>
           if (checkedReports.length == 0) {
               NotificationService.AutoFadeNotification("danger", "", "Ingen indberetninger er markerede!");
           } else {
               var modalInstance = $modal.open({
                   templateUrl: '/App/ApproveReports/Modals/ConfirmApproveSelectedTemplate.html',
                   controller: 'AcceptController',
                   backdrop: "static",
                   resolve: {
                       itemId: function () {
                           return -1;
                       },
                       pageNumber: -1
                   }
               });

               modalInstance.result.then(function () {
                   angular.forEach(checkedReports, function (value, key) {
                       Report.patch({ id: value }, {
                           "Status": "Accepted",
                           "ClosedDateTimestamp": moment().unix(),
                           "ApprovedById": $rootScope.CurrentUser.Id,
                       }, function () {
                           $scope.gridContainer.grid.dataSource.read();
                       });
                   });
                   checkedReports = [];
               });
           }
       }

       $scope.showRouteModal = function (routeId) {
           /// <summary>
           /// Opens show route modal.
           /// </summary>
           /// <param name="routeId"></param>
           var modalInstance = $modal.open({
               templateUrl: '/App/Admin/HTML/Reports/Modal/ShowRouteModalTemplate.html',
               controller: 'ShowRouteModalController',
               backdrop: "static",
               resolve: {
                   routeId: function () {
                       return routeId;
                   }
               }
           });
       }


       //$scope.ApproveWithAccountClick = function (id) {
       //    var modalInstance = $modal.open({
       //        templateUrl: '/App/ApproveReports/Modals/ConfirmApproveWithAccountTemplate.html',
       //        controller: "AcceptWithAccountController",
       //        backdrop: "static",
       //        resolve: {
       //            itemId: function () {
       //                return id;
       //            },
       //            pageNumber: -1
       //        }
       //    });

       //    modalInstance.result.then(function (res) {
       //        Report.patch({ id: id }, { "Status": "Accepted", "ClosedDateTimestamp": moment().unix(), "AccountNumber": res.AccountNumber }, function () {
       //            $scope.gridContainer.grid.dataSource.read();

       //        });
       //    });
       //}

       $scope.rejectClick = function (id) {
           /// <summary>
           /// Opens reject report modal.
           /// </summary>
           /// <param name="id"></param>
           var modalInstance = $modal.open({
               templateUrl: '/App/ApproveReports/Modals/ConfirmRejectTemplate.html',
               controller: 'RejectController',
               backdrop: "static",
               resolve: {
                   itemId: function () {
                       return id;
                   }
               }
           });

           modalInstance.result.then(function (res) {
               Report.patch({ id: id }, {
                   "Status": "Rejected",
                   "ClosedDateTimestamp": moment().unix(),
                   "Comment": res.Comment,
                   "ApprovedById": $rootScope.CurrentUser.Id,
               }, function () {
                   $scope.gridContainer.grid.dataSource.read();

               });
           });
       }


       var initialLoad = 2;
       $scope.dateChanged = function () {
           // $timeout is a bit of a hack, but it is needed to get the current input value because ng-change is called before ng-model updates.
           $timeout(function () {
               var from = $scope.getStartOfDayStamp($scope.dateContainer.fromDate);
               var to = $scope.getEndOfDayStamp($scope.dateContainer.toDate);

               // Initial load is also a bit of a hack.
               // dateChanged is called twice when the default values for the datepickers are set.
               // This leads to sorting the grid content on load, which is not what we want.
               // Therefore the sorting is not done the first 2 times the dates change - Which are the 2 times we set the default values.
               if (initialLoad <= 0) {
                   $scope.applyDateFilter(from, to);
               }
               initialLoad--;
           }, 0);
       }


       $scope.refreshGrid = function () {
           $scope.gridContainer.grid.dataSource.read();
       }



       // Init



       // Contains references to kendo ui grids.
       $scope.gridContainer = {};
       $scope.dateContainer = {};

       $scope.loadInitialDates();



       // Format for datepickers.
       $scope.dateOptions = {
           format: "dd/MM/yyyy",

       };

       $scope.personChanged = function (item) {
           $scope.applyPersonFilter($scope.person.chosenPerson);
       }

       $scope.person.chosenPerson = "";

       Person.getAll().$promise.then(function (res) {
           angular.forEach(res.value, function (value, key) {
               $scope.people.push({ Id: value.Id, FullName: value.FullName });
           });
       });





   }
]);