﻿angular.module("application").controller("RejectedReportsController", [
   "$scope", "$modal", "$rootScope", "Report", "OrgUnit", "Person", "$timeout", "NotificationService", "RateType", "Autocomplete","MkColumnFormatter", function ($scope, $modal, $rootScope, Report, OrgUnit, Person, $timeout, NotificationService, RateType, Autocomplete,MkColumnFormatter) {

       // Set personId. The value on $rootScope is set in resolve in application.js
       var personId = $rootScope.CurrentUser.Id;

       $scope.isLeader = $rootScope.CurrentUser.IsLeader;

       var allReports = [];

       $scope.tableSortHelp = $rootScope.HelpTexts.TableSortHelp.text;

       $scope.getEndOfDayStamp = function (d) {
           var m = moment(d);
           return m.endOf('day').unix();
       }

       $scope.getStartOfDayStamp = function (d) {
           var m = moment(d);
           return m.startOf('day').unix();
       }

       $scope.orgUnitAutoCompleteOptions = {
           filter: "contains",
           select: function (e) {
               $scope.orgUnit.chosenId = this.dataItem(e.item.index()).Id;
           }
       }

       $scope.personAutoCompleteOptions = {
           filter: "contains",
           select: function (e) {
               $scope.person.chosenId = this.dataItem(e.item.index()).Id;
           }
       };

       RateType.getAll().$promise.then(function (res) {
           $scope.rateTypes = res;
       });

       // dates for kendo filter.
       var fromDateFilter = new Date();
       fromDateFilter.setMonth(fromDateFilter.getMonth() - 3);
       fromDateFilter = $scope.getStartOfDayStamp(fromDateFilter);
       var toDateFilter = $scope.getEndOfDayStamp(new Date());

       $scope.checkboxes = {};
       $scope.checkboxes.showSubbed = false;

       $scope.orgUnit = {};
       $scope.orgUnits = Autocomplete.orgUnits();

       $scope.people = Autocomplete.activeUsers();
       $scope.person = {};



       $scope.clearClicked = function () {
           /// <summary>
           /// Clears filters.
           /// </summary>
           $scope.loadInitialDates();
           $scope.person.chosenPerson = "";
           $scope.orgUnit.chosenUnit = "";
           $scope.searchClicked();
       }

       $scope.searchClicked = function () {
           var from = $scope.getStartOfDayStamp($scope.dateContainer.fromDate);
           var to = $scope.getEndOfDayStamp($scope.dateContainer.toDate);
           $scope.gridContainer.grid.dataSource.transport.options.read.url = getDataUrl(from, to, $scope.person.chosenPerson, $scope.orgUnit.chosenUnit);
           $scope.gridContainer.grid.dataSource.read();
       }

       var getDataUrl = function (from, to, fullName, longDescription) {
           var url = "/odata/DriveReports?leaderId=" + personId + "&status=Rejected" + "&getReportsWhereSubExists=" + $scope.checkboxes.showSubbed + " &$expand=Employment($expand=OrgUnit),DriveReportPoints";
           var filters = "&$filter=DriveDateTimestamp ge " + from + " and DriveDateTimestamp le " + to;

           var leaderFilter = " and ResponsibleLeaderId eq " + $scope.CurrentUser.Id;

           if ($scope.checkboxes.showSubbed) {
               leaderFilter = " and (ResponsibleLeaderId eq " + $scope.CurrentUser.Id + " or ActualLeaderId eq " + $scope.CurrentUser.Id + ")";
           }

           if (fullName != undefined && fullName != "") {
               filters += " and PersonId eq " + $scope.person.chosenId;
           }
           if (longDescription != undefined && longDescription != "") {
               filters += " and Employment/OrgUnitId eq " + $scope.orgUnit.chosenId;
           }

           filters += leaderFilter;

           var result = url + filters;
           return result;
       }

       $scope.showSubsChanged = function () {
           /// <summary>
           /// Applies filter according to getReportsWhereSubExists
           /// </summary>
           $scope.searchClicked();
       }

       /// <summary>
       /// Loads rejected reports from backend to kendo grid datasource.
       /// </summary>
       $scope.reports = {
           autoBind: false,
           dataSource: {
               type: "odata-v4",
               transport: {
                   read: {
                       url: "/odata/DriveReports?leaderId=" + personId + "&status=Rejected" + "&getReportsWhereSubExists=" + $scope.checkboxes.showSubbed + " &$expand=Employment($expand=OrgUnit),DriveReportPoints &$filter=DriveDateTimestamp ge " + fromDateFilter + " and DriveDateTimestamp le " + toDateFilter + " and ResponsibleLeaderId eq " + $scope.CurrentUser.Id,
                       dataType: "json",
                       cache: false
                 },
               },
               schema: {
                   data: function (data) {

                       return data.value;

                   },
               },
               pageSize: 50,
               serverPaging: true,
               serverSorting: true,
               serverFiltering: true,
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
               pageSizes: [5, 10, 20, 30, 40, 50, 100, 150, 200]
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
               title: "Org.enhed"
           }, {
               field: "DriveDateTimestamp",
               template: function (data) {
                   var m = moment.unix(data.DriveDateTimestamp);
                   return m._d.getDate() + "/" +
                       (m._d.getMonth() + 1) + "/" + // +1 because getMonth is zero indexed.
                       m._d.getFullYear();
               },
               title: "Dato"
           }, {
               field: "Purpose",
               title: "Formål",
           }, {
               field: "TFCode",
               title: "Taksttype",
               template: function (data) {
                   for (var i = 0; i < $scope.rateTypes.length; i++) {
                       if ($scope.rateTypes[i].TFCode == data.TFCode) {
                           return $scope.rateTypes[i].Description;
                       }
                   }
               }
           }, {
               title: "Rute",
               field: "DriveReportPoints",
               template: function (data) {
                   var tooltipContent = "";
                   if (data.DriveReportPoints != null && data.DriveReportPoints != undefined && data.DriveReportPoints.length > 0) {
                       angular.forEach(data.DriveReportPoints, function (point, key) {
                           if (key != data.DriveReportPoints.length - 1) {
                               tooltipContent += point.StreetName + " " + point.StreetNumber + ", " + point.ZipCode + " " + point.Town + "<br/>";
                               gridContent += point.StreetName + "<br/>";
                           } else {
                               tooltipContent += point.StreetName + " " + point.StreetNumber + ", " + point.ZipCode + " " + point.Town;
                               gridContent += point.StreetName;
                           }
                       });
                   } else {
                       tooltipContent = data.UserComment;
                   }
                   var gridContent = "<i class='fa fa-road fa-2x'></i>";
                   var toolTip = "<div class='inline margin-left-5' kendo-tooltip k-content=\"'" + tooltipContent + "'\">" + gridContent + "</div>";
                   var globe = "<div class='inline pull-right margin-right-5' kendo-tooltip k-content=\"'Se rute på kort'\"><a ng-click='showRouteModal(" + data.Id + ")'><i class='fa fa-globe fa-2x'></i></a></div>";
                   if (data.IsOldMigratedReport) {
                       globe = "<div class='inline pull-right margin-right-5' kendo-tooltip k-content=\"'Denne indberetning er overført fra eIndberetning og der kan ikke genereres en rute på et kort'\"><i class='fa fa-circle-thin fa-2x'></i></a></div>";
                   }
                   var roundTrip = "";
                   if (data.IsRoundTrip) {
                       roundTrip = "<div class='inline margin-left-5' kendo-tooltip k-content=\"'Ruten er tur/retur'\"><i class='fa fa-exchange fa-2x'></i></div>";
                   }

                   var result = toolTip + roundTrip + globe;
                   var comment = data.UserComment != null ? data.UserComment : "Ingen kommentar angivet";

                   if (data.KilometerAllowance != "Read") {
                       return result;
                   } else {
                       if (data.IsFromApp) {
                           var fromAppTooltip = "<div class='inline margin-left-5' kendo-tooltip k-content=\"'" + data.UserComment + "'\">Indberettet fra mobil app</div>";
                           if (data.DriveReportPoints.length > 1) {
                               result = toolTip + roundTrip + fromAppTooltip + globe;
                           } else {
                               // Set road tooltip to just contain "Aflæst manuelt"
                               toolTip = "<div class='inline margin-left-5' kendo-tooltip k-content=\"'" + "Aflæst manuelt" + "'\">" + gridContent + "</div>";
                               result = toolTip + roundTrip + fromAppTooltip
                           }
                           return result;
                       } else {
                           return "<div kendo-tooltip k-content=\"'" + comment + "'\">Aflæst manuelt</div>";
                       }
                   }
               }
           }, {
               field: "Distance",
               title: "Km",
               template: function (data) {
                   return data.Distance.toFixed(2).toString().replace('.', ',') + " km";
               },
               footerTemplate: "Total: #= kendo.toString(sum, '0.00').replace('.',',') # km"
           }, {
               field: "AmountToReimburse",
               title: "Beløb",
               template: function (data) {
                   return data.AmountToReimburse.toFixed(2).toString().replace('.', ',') + " kr.";
               },
               footerTemplate: "Total: #= kendo.toString(sum, '0.00').replace('.',',') # kr."
           }, {
               field: "KilometerAllowance",
               title: "MK",
               template: function (data) {
                   return MkColumnFormatter.format(data);
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
               title: "Indberettet",
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

       $scope.loadInitialDates = function () {
           // Set initial values for kendo datepickers.
           var from = new Date();
           from.setMonth(from.getMonth() - 3);
           $scope.dateContainer.toDate = new Date();
           $scope.dateContainer.fromDate = from;
       }

       $scope.clearName = function () {
           $scope.chosenPerson = "";
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



       // Init


       // Contains references to kendo ui grids.
       $scope.gridContainer = {};
       $scope.dateContainer = {};

       $scope.loadInitialDates();

       // Format for datepickers.
       $scope.dateOptions = {
           format: "dd/MM/yyyy",
       };

       $scope.refreshGrid = function () {
           $scope.gridContainer.grid.dataSource.read();
       }
   }
]);