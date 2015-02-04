/// <reference path="../../scripts/typings/kendo/kendo.all.d.ts" />
var MyReports;
(function (MyReports) {
    'use strict';
    var Controller = (function () {
        function Controller($scope) {
            this.$scope = $scope;
            $scope.pendingReports = {
                dataSource: {
                    type: "odata",
                    transport: {
                        read: {
                            beforeSend: function (req) {
                                req.setRequestHeader('Accept', 'application/json;odata=fullmetadata');
                            },
                            url: "/odata/TestReports",
                            dataType: "json"
                        },
                        parameterMap: function (options, type) {
                            var paramMap = kendo.data.transports.odata.parameterMap(options);
                            console.log(paramMap);
                            delete paramMap.$inlinecount; // <-- remove inlinecount parameter
                            delete paramMap.$format; // <-- remove format parameter
                            console.log(paramMap);
                            return paramMap;
                        }
                    },
                    schema: {
                        data: function (data) {
                            return data; // <-- The result is just the data, it doesn't need to be unpacked.
                        },
                        total: function (data) {
                            return data.length; // <-- The total items count is the data length, there is no .Count to unpack.
                        }
                    },
                    pageSize: 5,
                    serverPaging: true,
                    serverSorting: true
                },
                sortable: true,
                pageable: true,
                dataBound: function () {
                    this.expandRow(this.tbody.find("tr.k-master-row").first());
                },
                columns: [
                    {
                        field: "Name",
                        title: "Navn"
                    },
                    {
                        field: "ReportedDate",
                        title: "Indberetet den"
                    },
                    {
                        field: "Purpose",
                        title: "Formål"
                    },
                    {
                        field: "Type",
                        title: "Type"
                    },
                    {
                        field: "options",
                        title: "Muligheder"
                    }
                ]
            };
            $scope.approvedReports = {
                dataSource: {
                    type: "odata",
                    transport: {
                        read: "http://demos.telerik.com/kendo-ui/service/Northwind.svc/Employees"
                    },
                    pageSize: 5,
                    serverPaging: true,
                    serverSorting: true
                },
                sortable: true,
                pageable: true,
                dataBound: function () {
                    this.expandRow(this.tbody.find("tr.k-master-row").first());
                },
                columns: [
                    {
                        field: "FirstName",
                        title: "First Name",
                        width: "120px"
                    },
                    {
                        field: "LastName",
                        title: "Last Name",
                        width: "120px"
                    },
                    {
                        field: "Country",
                        width: "120px"
                    },
                    {
                        field: "City",
                        width: "120px"
                    },
                    {
                        field: "Title"
                    }
                ]
            };
            $scope.deniedReports = {
                dataSource: {
                    type: "odata",
                    transport: {
                        read: "http://demos.telerik.com/kendo-ui/service/Northwind.svc/Employees"
                    },
                    pageSize: 5,
                    serverPaging: true,
                    serverSorting: true
                },
                sortable: true,
                pageable: true,
                dataBound: function () {
                    this.expandRow(this.tbody.find("tr.k-master-row").first());
                },
                columns: [
                    {
                        field: "FirstName",
                        title: "First Name",
                        width: "120px"
                    },
                    {
                        field: "LastName",
                        title: "Last Name",
                        width: "120px"
                    },
                    {
                        field: "Country",
                        width: "120px"
                    },
                    {
                        field: "City",
                        width: "120px"
                    },
                    {
                        field: "Title"
                    }
                ]
            };
            console.log(this.$scope);
        }
        return Controller;
    })();
    MyReports.Controller = Controller;
})(MyReports || (MyReports = {}));
Application.AngularApp.Module.controller("MyReportsController", MyReports.Controller);
//# sourceMappingURL=MyReportsController.js.map