﻿angular.module("application").controller("RejectedReportsController", [
   "$scope", "$modal", "$rootScope", "Report", "OrgUnit", "Person", "$timeout", "NotificationService", "HelpText", function ($scope, $modal, $rootScope, Report, OrgUnit, Person, $timeout, NotificationService, HelpText) {

       // Set personId. The value on $rootScope is set in resolve in application.js
       var personId = $rootScope.CurrentUser.Id;

       var allReports = [];

       HelpText.get({ id: "TableSortHelp" }).$promise.then(function (res) {
           $scope.tableSortHelp = res.text;
       });

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

       $scope.checkboxes = {};
       $scope.checkboxes.showSubbed = false;

       $scope.orgUnit = {};
       $scope.orgUnits = [];

       OrgUnit.get().$promise.then(function (res) {
           $scope.orgUnits = res.value;
       });

       $scope.orgUnitChanged = function (item) {
           $scope.applyOrgUnitFilter($scope.orgUnit.chosenUnit);
       }


       $scope.showSubsChanged = function () {
           $scope.gridContainer.grid.dataSource.transport.options.read.url = "/odata/DriveReports?leaderId=" + personId + "&status=Rejected" + "&getReportsWhereSubExists=" + $scope.checkboxes.showSubbed + " &$expand=Employment($expand=OrgUnit),DriveReportPoints";
           $scope.gridContainer.grid.dataSource.read();
       }

       $scope.applyOrgUnitFilter = function (longDescription) {
           var oldFilters = $scope.gridContainer.grid.dataSource.filter();
           var newFilters = [];


           if (oldFilters == undefined) {
               // If no filters exist, just add the filters.
               if (longDescription != "") {
                   newFilters.push({ field: "Employment.OrgUnit.LongDescription", operator: "eq", value: longDescription });
               }
           } else {
               // If filters already exist then get the old filters, that arent drivedate.
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

       $scope.loadReports = function () {
           $scope.reports = {
               dataSource: {
                   type: "odata-v4",
                   transport: {
                       read: {
                           url: "/odata/DriveReports?leaderId=" + personId + "&status=Rejected" + "&getReportsWhereSubExists=" + $scope.checkboxes.showSubbed + " &$expand=Employment($expand=OrgUnit),DriveReportPoints",
                       },
                   },
                   schema: {
                       data: function (data) {

                           return data.value;

                       },
                   },
                   pageSize: 20,
                   serverPaging: true,
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
               scrollable: false,
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
                       refresh: "Genopfrisk"
                   },
                   pageSizes: [5, 10, 20, 30, 40, 50]
               },
               dataBound: function () {
                   $scope.getCurrentPageSums();
                   $scope.getAllPagesSums();
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
                               gridContent += point.StreetName + "<br/>";
                           } else {
                               tooltipContent += point.StreetName + " " + point.StreetNumber + ", " + point.ZipCode + " " + point.Town;
                               gridContent += point.StreetName;
                           }
                       });
                       var result = "<div kendo-tooltip k-content=\"'" + tooltipContent + "'\">" + gridContent + "</div> <a ng-click='showRouteModal(" + data.Id + ")'>Se rute på kort</a>";

                       if (data.KilometerAllowance != "Read") {
                           return result;
                       } else {
                           return data.UserComment;
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
                   field: "ClosedDateTimestamp",
                   title: "Afvist dato",
                   template: function (data) {
                       var m = moment.unix(data.ClosedDateTimestamp);
                       var date = m._d.getDate() + "/" +
                           (m._d.getMonth() + 1) + "/" + // +1 because getMonth is zero indexed.
                           m._d.getFullYear();

                       return date + "<div class='inline' kendo-tooltip k-content=\"'" + data.Comment + "'\"> <i class='fa fa-comment-o'></i></div>";

                   }
               }
               ],
           };
       }

       $scope.loadInitialDates = function () {
           // Set initial values for kendo datepickers.

           initialLoad = 2;

           var from = new Date();
           from.setDate(from.getDate() - 30);

           $scope.dateContainer.toDate = new Date();
           $scope.dateContainer.fromDate = from;

       }

       $scope.getCurrentPageSums = function () {
           var pageNumber = $scope.gridContainer.grid.dataSource.page();
           var pageSize = $scope.gridContainer.grid.dataSource.pageSize();
           var first = pageSize * (pageNumber - 1);
           var last = first + pageSize - 1;
           var resAmount = 0;
           var resDistance = 0;
           for (var i = first; i <= last; i++) {
               if (allReports[i] != undefined) {
                   resAmount += allReports[i].AmountToReimburse;
                   resDistance += allReports[i].Distance;
               }

           }
           $scope.currentPageAmountSum = resAmount.toFixed(2).toString().replace('.', ',');
           $scope.currentPageDistanceSum = resDistance.toFixed(2).toString().replace('.', ',');

       }

       $scope.getAllPagesSums = function () {
           var resAmount = 0;
           var resDistance = 0;
           angular.forEach(allReports, function (rep, key) {
               resAmount += rep.AmountToReimburse;
               resDistance += rep.Distance;
           });
           $scope.allPagesAmountSum = resAmount.toFixed(2).toString().replace('.', ',');
           $scope.allPagesDistanceSum = resDistance.toFixed(2).toString().replace('.', ',');
       }

      

       // Event handlers

       $scope.pageSizeChanged = function () {
           $scope.gridContainer.grid.dataSource.pageSize(Number($scope.gridContainer.gridPageSize));
       }

       $scope.clearName = function () {
           $scope.chosenPerson = "";
       }

       $scope.clearClicked = function () {
           $scope.loadInitialDates();
           $scope.removeDateFilter();
           $scope.removePersonFilter();
           $scope.removeOrgUnitFilter();
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

       $scope.showRouteModal = function (routeId) {
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


       // Load up the grids.
       $scope.loadReports();

       $scope.personChanged = function (item) {
           $scope.applyPersonFilter($scope.person.chosenPerson);

       }

       // Load people for auto-complete textbox
       $scope.people = [];
       $scope.person = {};

       // Set initial value for grid pagesize
       $scope.gridContainer.gridPageSize = 20;

       Person.getAll().$promise.then(function (res) {
           angular.forEach(res.value, function (value, key) {
               $scope.people.push({ Id: value.Id, FullName: value.FullName });
           });
       });




   }
]);