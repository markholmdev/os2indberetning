﻿angular.module("application").controller("SettingController", [
    "$scope", "$modal", "Person", "LicensePlate", "PersonalRoute", "Point", "Address", "Route", "AddressFormatter", "$http", "NotificationService", "Token", "SmartAdresseSource", "$rootScope", "HelpText",
    function ($scope, $modal, Person, LicensePlate, Personalroute, Point, Address, Route, AddressFormatter, $http, NotificationService, Token, SmartAdresseSource, $rootScope, HelpText) {
        $scope.gridContainer = {};
        $scope.isCollapsed = true;
        $scope.mailAdvice = '';
        $scope.licenseplates = [];
        $scope.newLicensePlate = "";
        $scope.newLicensePlateDescription = "";
        $scope.workDistanceOverride = 0;
        $scope.recieveMail = false;
        $scope.routes = [];
        $scope.addresses = [];
        $scope.tokens = [];
        $scope.isCollapsed = true;
        $scope.tokenIsCollapsed = true;
        $scope.newTokenDescription = "";

        HelpText.get({ id: "MobileTokenHelpText" }).$promise.then(function (res) {
            $scope.mobileTokenHelpText = res.text;
        });

        HelpText.get({ id: "PrimaryLicensePlateHelpText" }).$promise.then(function (res) {
            $scope.primaryLicensePlateHelpText = res.text;
        });



        var personId = $rootScope.CurrentUser.Id;
        $scope.showMailNotification = $rootScope.CurrentUser.IsLeader;
        // Used for alternative address template
        $scope.employments = $rootScope.CurrentUser.Employments;

        // Contains references to kendo ui grids.
        $scope.gridContainer = {};

        $scope.GetPerson = Person.get({ id: personId }, function (data) {
            $scope.currentPerson = data;
            //  $scope.workDistanceOverride = $scope.currentPerson.WorkDistanceOverride.toString().replace('.', ',');
            $scope.recieveMail = data.RecieveMail;

            //Set choice of mail notification
            if ($scope.recieveMail == true) {
                $scope.mailAdvice = 'Yes';
            } else {
                $scope.mailAdvice = 'No';
            }

            //Load licenseplates
            LicensePlate.get({ id: personId }, function (data) {
                $scope.licenseplates = data;
            });


            //NotificationService.AutoFadeNotification("success", "Success", "Person fundet");
        }, function () {
            NotificationService.AutoFadeNotification("danger", "", "Person ikke fundet");
        });



        //Funtionalitet til opslag af adresser
        $scope.SmartAddress = SmartAdresseSource;


        //Gem ny nummerplade
        $scope.saveNewLicensePlate = function () {

            var plateWithoutSpaces = $scope.newLicensePlate.replace(/ /g, "");
            if (plateWithoutSpaces.length < 2 || plateWithoutSpaces.length > 7) {
                NotificationService.AutoFadeNotification("danger", "", "Nummerpladens længde skal være mellem 2 og 7 tegn (Mellemrum tæller ikke med)");
                return;
            }

            var newPlate = new LicensePlate({
                Plate: $scope.newLicensePlate,
                Description: $scope.newLicensePlateDescription,
                PersonId: personId
            });

            newPlate.$save(function (data) {
                $scope.licenseplates.push(data);
                $scope.licenseplates.sort(function (a, b) {
                    return a.Id > b.Id;
                });
                $scope.newLicensePlate = "";
                $scope.newLicensePlateDescription = "";

                NotificationService.AutoFadeNotification("success", "", "Ny nummerplade blev gemt");
            }, function () {
                NotificationService.AutoFadeNotification("danger", "", "Nummerplade blev ikke gemt");
            });
        };

        //Slet eksisterende nummerplade
        $scope.deleteLicensePlate = function (plate) {
            LicensePlate.delete({ id: plate.Id }, function () {
                NotificationService.AutoFadeNotification("success", "", "Nummerplade blev slettet");
                //Load licenseplates again
                LicensePlate.get({ id: personId }, function (data) {
                    $scope.licenseplates = data;
                });
            }), function () {
                NotificationService.AutoFadeNotification("danger", "", "Nummerplade blev ikke slettet");
            };
        }

        //Skift valg om mailnotifikationer
        $scope.invertRecieveMail = function () {
            $scope.recieveMail = !$scope.recieveMail;

            var newPerson = new Person({
                RecieveMail: $scope.recieveMail
            });

            newPerson.$patch({ id: personId }, function () {
                NotificationService.AutoFadeNotification("success", "", "Valg om modtagelse af mails blev gemt");
            }), function () {
                $scope.recieveMail = !$scope.recieveMail;
                NotificationService.AutoFadeNotification("danger", "", "Valg om modtagelse af mails blev ikke gemt");
            };
        }

        $scope.loadGrids = function (id) {
            $scope.personalRoutes = {
                dataSource: {
                    type: "odata",
                    transport: {
                        read: {
                            beforeSend: function (req) {
                                req.setRequestHeader('Accept', 'application/json;odata=fullmetadata');
                            },
                            url: "odata/PersonalRoutes()?$filter=PersonId eq " + id + "&$expand=Points",
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
                    schema: {
                        data: function (data) {
                            return data.value; // <-- The result is just the data, it doesn't need to be unpacked.
                        },
                        total: function (data) {
                            return data['@odata.count']; // <-- The total items count is the data length, there is no .Count to unpack.
                        }
                    },
                    pageSize: 20,
                    serverPaging: true,
                    serverSorting: true
                },
                sortable: true,
                pageable: {
                    messages: {
                        display: "{0} - {1} af {2} personlige ruter", //{0} is the index of the first record on the page, {1} - index of the last record on the page, {2} is the total amount of records
                        empty: "Ingen personlige ruter at vise",
                        page: "Side",
                        of: "af {0}", //{0} is total amount of pages
                        itemsPerPage: "personlige ruter pr. side",
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
                        field: "Description",
                        title: "Beskrivelse"
                    }, {
                        field: "Points",
                        template: function (data) {
                            var temp = [];

                            angular.forEach(data.Points, function (value, key) {
                                if (value.PreviousPointId == undefined) {
                                    this.push(value.StreetName + " " + value.StreetNumber + ", " + value.ZipCode + " " + value.Town);
                                }

                            }, temp);

                            return temp;
                        },
                        title: "Fra"
                    }, {
                        field: "Points",
                        template: function (data) {
                            var temp = [];

                            angular.forEach(data.Points, function (value, key) {
                                if (value.NextPointId == null) {
                                    this.push(value.StreetName + " " + value.StreetNumber + ", " + value.ZipCode + " " + value.Town);
                                }

                            }, temp);

                            return temp;
                        },
                        title: "Til"
                    }, {
                        title: "Via",
                        field: "Points",
                        width: 50,
                        template: function (data) {
                            var tooltipContent = "";
                            var gridContent = data.Points.length - 2;
                            angular.forEach(data.Points, function (point, key) {
                                if (key != 0 && key != data.Points.length - 1) {
                                    tooltipContent += point.StreetName + " " + point.StreetNumber + ", " + point.ZipCode + " " + point.Town + "<br/>";
                                }
                            });

                            var result = "<div kendo-tooltip k-content=\"'" + tooltipContent + "'\">" + gridContent + "</div>";
                            return result;
                        }
                    },
                    {
                        field: "Id",
                        title: "Muligheder",
                        template: "<a ng-click='openRouteEditModal(${Id})'>Rediger</a> | <a ng-click='openRouteDeleteModal(${Id})'>Slet</a>"
                    }
                ]
            };

            $scope.personalAddresses = {
                dataSource: {
                    type: "odata",
                    transport: {
                        read: {
                            beforeSend: function (req) {
                                req.setRequestHeader('Accept', 'application/json;odata=fullmetadata');
                            },
                            url: "odata/PersonalAddresses()?$filter=PersonId eq " + personId,
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
                    schema: {
                        data: function (data) {
                            return data.value;
                        },
                        total: function (data) {
                            return data['@odata.count']; // <-- The total items count is the data length, there is no .Count to unpack.
                        }
                    },
                    pageSize: 5,
                    serverPaging: false,
                    serverSorting: true
                },
                sortable: true,
                pageable: {
                    messages: {
                        display: "{0} - {1} af {2} personlige adresser", //{0} is the index of the first record on the page, {1} - index of the last record on the page, {2} is the total amount of records
                        empty: "Ingen personlige adresser at vise",
                        page: "Side",
                        of: "af {0}", //{0} is total amount of pages
                        itemsPerPage: "personlige adresser pr. side",
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
                        field: "Description",
                        title: "Beskrivelse",
                        template: function (data) {
                            if (data.Type == "Home") {
                                return "Hjemmeadresse";
                            } else return data.Description;
                        }
                    }, {
                        field: "Id",
                        template: function (data) {
                            return (data.StreetName + " " + data.StreetNumber + ", " + data.ZipCode + " " + data.Town);
                        },
                        title: "Adresse"
                    }, {
                        field: "Id",
                        title: "Muligheder",
                        template: function (data) {
                            if (data.Type == "Standard") {
                                return "<a ng-click='openAddressEditModal(" + data.Id + ")'>Rediger</a> | <a ng-click='openAddressDeleteModal(" + data.Id + ")'>Slet</a>";
                            }
                            return "";
                        }
                    }
                ]
            };
        }

        $rootScope.$on('PersonalAddressesChanged', function () {
            // Event gets emitted from AlternativeAddressController when the user changes alternative home or work addresses.
            $scope.updatePersonalAddresses();
        });

        $scope.loadGrids($rootScope.CurrentUser.Id);

        $scope.updatePersonalAddresses = function () {
            $scope.gridContainer.personalAddressesGrid.dataSource.transport.options.read.url = "odata/PersonalAddresses()?$filter=PersonId eq " + $scope.currentPerson.Id;
            $scope.gridContainer.personalAddressesGrid.dataSource.read();
        }

        $scope.updatePersonalRoutes = function () {
            $scope.gridcontainer.personalRoutesGrid.dataSource.transport.options.read.url = "odata/PersonalRoutes()?$filter=PersonId eq " + $scope.currentPerson.Id + "&$expand=Points";
            $scope.gridcontainer.personalRoutesGrid.dataSource.read();

        }

        //$scope.openTokenModal = function (size) {

        //    var modalInstance = $modal.open({
        //        templateUrl: '/App/Settings/tokenModal.html',
        //        controller: 'TokenInstanceController',
        //        backdrop: 'static',
        //        size: size,
        //        resolve: {
        //            personId: function () {
        //                return $scope.currentPerson.Id;
        //            }
        //        }
        //    });

        //    modalInstance.result.then(function () {

        //    });
        //};

        $scope.openRouteEditModal = function (id) {

            var modalInstance = $modal.open({
                templateUrl: '/App/Settings/RouteEditModal.html',
                controller: 'RouteEditModalInstanceController',
                backdrop: 'static',
                resolve: {
                    routeId: function () {
                        return id;
                    },
                    personId: function () {
                        return $scope.currentPerson.Id;
                    }
                }
            });

            modalInstance.result.then(function () {
                $scope.updatePersonalRoutes();
            });
        };

        $scope.openRouteAddModal = function (id) {

            var modalInstance = $modal.open({
                templateUrl: '/App/Settings/RouteAddModal.html',
                controller: 'RouteEditModalInstanceController',
                backdrop: 'static',
                resolve: {
                    routeId: function () {
                        return;
                    },
                    personId: function () {
                        return $scope.currentPerson.Id;
                    }
                }
            });

            modalInstance.result.then(function () {
                $scope.updatePersonalRoutes();
            });
        };

        $scope.openRouteDeleteModal = function (id) {

            var modalInstance = $modal.open({
                templateUrl: '/App/Settings/RouteDeleteModal.html',
                controller: 'RouteDeleteModalInstanceController',
                backdrop: 'static',
                resolve: {
                    routeId: function () {
                        return id;
                    },
                    personId: function () {
                        return $scope.currentPerson.Id;
                    }
                }
            });

            modalInstance.result.then(function () {
                $scope.updatePersonalRoutes();
            });
        };

        $scope.openAddressAddModal = function () {

            var modalInstance = $modal.open({
                templateUrl: '/App/Settings/AddressAddModal.html',
                controller: 'AddressEditModalInstanceController',
                backdrop: 'static',
                resolve: {
                    addressId: function () {
                        return;
                    },
                    personId: function () {
                        return $scope.currentPerson.Id;
                    }
                }
            });

            modalInstance.result.then(function () {
                $scope.updatePersonalAddresses();
            });
        };

        $scope.openAddressEditModal = function (id) {

            var modalInstance = $modal.open({
                templateUrl: '/App/Settings/AddressEditModal.html',
                controller: 'AddressEditModalInstanceController',
                backdrop: 'static',
                resolve: {
                    addressId: function () {
                        return id;
                    },
                    personId: function () {
                        return $scope.currentPerson.Id;
                    }
                }
            });

            modalInstance.result.then(function () {
                $scope.updatePersonalAddresses();
            });
        };

        $scope.openAddressDeleteModal = function (id) {

            var modalInstance = $modal.open({
                templateUrl: '/App/Settings/AddressDeleteModal.html',
                controller: 'AddressDeleteModalInstanceController',
                backdrop: 'static',
                resolve: {
                    addressId: function () {
                        return id;
                    },
                    personId: function () {
                        return $scope.currentPerson.Id;
                    }
                }
            });

            modalInstance.result.then(function () {
                $scope.updatePersonalAddresses();
            });
        };

        Token.get({ id: personId }, function (data) {
            $scope.tokens = data.value;
        }, function () {
            NotificationService.AutoFadeNotification("danger", "", "Kunne ikke hente tokens");
        });

        $scope.deleteToken = function (token) {
            var objIndex = $scope.tokens.indexOf(token);
            $scope.tokens.splice(objIndex, 1);

            Token.delete({ id: token.Id }, function (data) {
                NotificationService.AutoFadeNotification("success", "", "Token blev slettet");
            }, function () {
                $scope.tokens.push(token);
                NotificationService.AutoFadeNotification("danger", "", "Token blev ikke slettet");
            });
        }

        $scope.saveToken = function () {
            var newToken = new Token({
                PersonId: personId,
                Status: "Created",
                Description: $scope.newTokenDescription
            });

            newToken.$save(function (data) {
                $scope.tokens.push(data);
                NotificationService.AutoFadeNotification("success", "", "Ny token oprettet");
                $scope.newTokenDescription = "";
                $scope.tokenIsCollapsed = !$scope.tokenIsCollapsed;
            }, function () {
                NotificationService.AutoFadeNotification("danger", "", "Kunne ikke oprette ny token");
            });
        }

        $scope.newToken = function () {
            $scope.tokenIsCollapsed = !$scope.tokenIsCollapsed;
        }

        $scope.closeTokenModal = function () {
            $modalInstance.close({

            });
        }

        $scope.openConfirmDeleteTokenModal = function (token) {

            var modalInstance = $modal.open({
                templateUrl: '/App/Settings/confirmDeleteTokenModal.html',
                controller: 'confirmDeleteToken',
                backdrop: 'static',
                resolve: {
                    token: function () {
                        return token;
                    }
                }
            });

            modalInstance.result.then(function (tokenToDelete) {
                $scope.deleteToken(tokenToDelete);
            }, function () {

            });
        };

        $scope.makeLicensePlatePrimary = function (plate) {
            LicensePlate.patch({ id: plate.Id }, { IsPrimary: true }, function () {
                //Load licenseplates when finished request.
                LicensePlate.get({ id: personId }, function (data) {
                    $scope.licenseplates = data;
                });
            });
        }

        $scope.openAlternativeWorkAddressModal = function () {

            var modalInstance = $modal.open({
                templateUrl: '/App/Settings/AlternativeWorkAddressModal.html',
                controller: 'AlternativeWorkAddressModalController',
                backdrop: 'static',
            });

            modalInstance.result.then(function (res) {

            }, function () {

            });
        };

        // Alert user if there are unsaved changes when navigating away.
        $scope.$on('$stateChangeStart', function (event) {
            if ($scope.newTokenDescription != "" ||
                $scope.newLicensePlate != "" ||
                $scope.newLicensePlateDescription != "") {
                var answer = confirm("Du har lavet ændringer på siden, der ikke er gemt. Ønsker du at kassere disse ændringer?");
                if (!answer) {
                    event.preventDefault();
                }
            }
        });
    }
]);