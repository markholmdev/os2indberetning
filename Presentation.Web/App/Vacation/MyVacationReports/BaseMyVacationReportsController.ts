﻿module app.vacation {
    "use strict";

    export abstract class BaseMyVacationReportsController {

        vacationReportsGrid: kendo.ui.Grid;
        vacationReportsOptions: kendo.ui.GridOptions;
        vacationYear: Date;
        personId: number;

        constructor(
            protected $modal,
            protected $rootScope,
            protected VacationReport,
            protected $timeout,
            protected Person,
            protected moment,
            protected ReportStatus) {

            // Set personId. The value on $rootScope is set in resolve in application.js
            this.personId = $rootScope.CurrentUser.Id;
            this.loadInitialDates();
        }

        refreshGrid() {
            /// <summary>
            /// Refreshes kendo grid datasource.
            /// </summary>
            this.$timeout(() => {
                this.vacationReportsGrid.dataSource.read();
            });
        }

        loadInitialDates() {
            /// <summary>
            /// Sets initial date filters.
            /// </summary>
            // Set initial values for kendo datepickers.
            // date for kendo filter.
            let currentDate = this.moment();

            if (this.moment().isBefore(`${this.vacationYear}-05-01`)) {
                currentDate = currentDate.subtract({'year':1});
            }

            this.vacationYear = currentDate.toDate();
        }

        deleteClick = (id) => {
            var modalInstance = this.$modal.open({
                templateUrl: '/App/Vacation/MyVacationReports/ConfirmDeleteVacationReportTemplate.html',
                controller: 'ConfirmDeleteVacationReportController as cdvrCtrl',
                backdrop: "static",
                resolve: {
                    itemId: () => {
                        return id;
                    }
                }
            });

            modalInstance.result.then(() => {
                this.VacationReport.delete({ id: id }, () => {
                    this.refreshGrid();
                });
            });

        }

        editClick = (id) => {
            /// <summary>
            /// Opens edit report modal
            /// </summary>
            /// <param name="id"></param>
            var modalInstance = this.$modal.open({
                templateUrl: '/App/Vacation/MyVacationReports/EditVacationReportTemplate.html',
                controller: 'ReportVacationController as rvc',
                backdrop: "static",
                windowClass: "app-modal-window-full",
                resolve: {
                    vacationReportId: () => {
                        return id;
                    }
                }
            });

            modalInstance.result.then(() => {
                this.refreshGrid();
            });
        }

        clearClicked() {
            this.loadInitialDates();
            this.refreshGrid();
        }

        // Format for datepickers.
        dateOptions: kendo.ui.DatePickerOptions = {
            format: "yyyy",
            start: "decade",
            depth: "decade"
        };
    }
}
