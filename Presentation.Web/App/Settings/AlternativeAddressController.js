﻿angular.module("application").controller('AlternativeAddressController', ["$scope", "SmartAdresseSource", "$rootScope", "$timeout", "PersonEmployments", "AddressFormatter", "Address", "NotificationService", "PersonalAddress", function ($scope, SmartAdresseSource, $rootScope, $timeout, PersonEmployments, AddressFormatter, Address, NotificationService, PersonalAddress) {

    $scope.employments = $rootScope.CurrentUser.Employments;
    $scope.homeAddress = "";
    $scope.alternativeHomeAddress = {};
    $scope.alternativeHomeAddress.string = "";

    var homeAddressIsDirty = false;
    var workAddressDirty = [];

    PersonalAddress.GetRealHomeForUser({ id: $rootScope.CurrentUser.Id }).$promise.then(function (res) {
        $scope.homeAddress = res.StreetName + " " + res.StreetNumber + ", " + res.ZipCode + " " + res.Town;
    });

    $scope.AlternativeWorkAddressHelpText = $rootScope.HelpTexts.AlternativeWorkAddressHelpText.text;
    $scope.AlternativeWorkDistanceHelpText = $rootScope.HelpTexts.AlternativeWorkDistanceHelpText.text;

    PersonalAddress.GetAlternativeHomeForUser({ id: $rootScope.CurrentUser.Id }).$promise.then(function (res) {
        if (!(res.StreetNumber == undefined)) {
            $scope.alternativeHomeAddress = res;
            $scope.alternativeHomeAddress.string = res.StreetName + " " + res.StreetNumber + ", " + res.ZipCode + " " + res.Town;
        }
    });
    $scope.Number = Number;
    $scope.toString = toString;
    $scope.replace = String.replace;
    $scope.alternativeWorkAddresses = [];
    $scope.alternativeWorkDistances = [];

    var loadLocalModel = function () {
        /// <summary>
        /// Fills local model variables with data.
        /// </summary>
        angular.forEach($scope.employments, function (empl, key) {
            if (empl.AlternativeWorkAddress != null) {
                var addr = empl.AlternativeWorkAddress;
                $scope.alternativeWorkAddresses[key] = addr.StreetName + " " + addr.StreetNumber + ", " + addr.ZipCode + " " + addr.Town;
            } else if (empl.WorkDistanceOverride != "" && empl.WorkDistanceOverride != null) {
                $scope.alternativeWorkDistances[key] = empl.WorkDistanceOverride;
            }
        });
    }

    $scope.alternativeWorkDistanceChanged = function ($index) {
        /// <summary>
        /// Clears alternative work address when changing alternative work distance.
        /// </summary>
        /// <param name="$index"></param>
        $scope.alternativeWorkAddresses[$index] = '';
        workAddressDirty[$index] = true;
    }

    $scope.alternativeWorkAddressChanged = function ($index) {
        /// <summary>
        /// Clears alternative work distance when changing alternative work address.
        /// </summary>
        /// <param name="$index"></param>
        $scope.alternativeWorkDistances[$index] = '';
        workAddressDirty[$index] = true;
    }

    loadLocalModel();

    var isAddressSet = function (index) {
        return ($scope.alternativeWorkAddresses[index] != "" && $scope.alternativeWorkAddresses[index] != undefined);
    }

    var isDistanceSet = function (index) {
        return ($scope.alternativeWorkDistances[index] != "" && $scope.alternativeWorkDistances[index] != undefined);
    }

    $scope.saveAlternativeWorkAddress = function (index) {
        // Timeout to allow the address to be written to the model.
        $timeout(function () {
            handleSaveAlternativeWork(index);
        });
    }

    var handleSaveAlternativeWork = function (index) {
        /// <summary>
        /// Handles saving alternative work address.
        /// </summary>
        /// <param name="index"></param>
        // Both fields empty. Clear.
        if (!isAddressSet(index) && (!isDistanceSet(index) || $scope.alternativeWorkDistances[index] == 0)) {
            $scope.clearWorkClicked(index);
        }
            // Address is set. Save it.
        else if (isAddressSet(index)) {
            var addr = AddressFormatter.fn($scope.alternativeWorkAddresses[index]);
            // No alternative address exists. Post.
            if ($scope.employments[index].AlternativeWorkAddress == null || $scope.employments[index].AlternativeWorkAddress == undefined) {
                Address.post({
                    StreetName: addr.StreetName,
                    StreetNumber: addr.StreetNumber,
                    Town: addr.Town,
                    ZipCode: addr.ZipCode,
                    PersonId: $rootScope.CurrentUser.Id,
                    Description: "Afvigende " + $scope.employments[index].OrgUnit.LongDescription,
                    Longitude: "",
                    Latitude: "",
                    Type: "AlternativeWork"
                }).$promise.then(function (res) {
                    workAddressDirty[index] = false;
                    $scope.employments[index].AlternativeWorkAddress = res;
                    $scope.employments[index].AlternativeWorkAddressId = res.Id;
                    loadLocalModel();

                    PersonEmployments.patchEmployment({ id: $scope.employments[index].Id }, { AlternativeWorkAddressId: res.Id }).$promise.then(function () {
                        NotificationService.AutoFadeNotification("success", "", "Afvigende arbejdsadresse oprettet.");
                        $rootScope.$emit('PersonalAddressesChanged');
                    });
                });
            }
                // Alternative Address already exists. Patch it.
            else {
                Address.patch({ id: $scope.employments[index].AlternativeWorkAddressId }, {
                    StreetName: addr.StreetName,
                    StreetNumber: addr.StreetNumber,
                    Town: addr.Town,
                    ZipCode: addr.ZipCode,
                    Longitude: "",
                    Latitude: "",
                }).$promise.then(function () {
                    workAddressDirty[index] = false;
                    NotificationService.AutoFadeNotification("success", "", "Afvigende arbejdsadresse redigeret.");
                    $rootScope.$emit('PersonalAddressesChanged');
                });
            }
        }
            // Show popup if distance contains , or .
        else if ($scope.alternativeWorkDistances[index].toString().indexOf(".") > -1 || $scope.alternativeWorkDistances[index].toString().indexOf(",") > -1) {
            NotificationService.AutoFadeNotification("warning", "", "Afvigende km på ikke indeholde komma eller punktum.");
        }

            // Address is not set. Distance is. Save that.
        else if (Number($scope.alternativeWorkDistances[index]) >= 0) {
            PersonEmployments.patchEmployment({ id: $scope.employments[index].Id },
            {
                WorkDistanceOverride: $scope.alternativeWorkDistances[index],
                AlternativeWorkAddress: null,
                AlternativeWorkAddressId: null
            }).$promise.then(function () {
                workAddressDirty[index] = false;
                if ($scope.employments[index].AlternativeWorkAddressId != null) {
                    Address.delete({ id: $scope.employments[index].AlternativeWorkAddressId }).$promise.then(function () {
                        $rootScope.$emit('PersonalAddressesChanged');
                    });
                }
                // Clear local model
                $scope.employments[index].AlternativeWorkAddress = null;
                $scope.employments[index].AlternativeWorkAddressId = null;
                $scope.employments[index].WorkDistanceOverride = $scope.alternativeWorkDistances[index];

                loadLocalModel();
                NotificationService.AutoFadeNotification("success", "", "Afvigende afstand mellem hjem og arbejde gemt.");
                $rootScope.$emit('PersonalAddressesChanged');
            });
        }
    }


    $scope.clearWorkClicked = function (index) {
        /// <summary>
        /// Clears alternative work address.
        /// </summary>
        /// <param name="index"></param>
        PersonEmployments.patchEmployment({ id: $scope.employments[index].Id }, {
            WorkDistanceOverride: 0,
            AlternativeWorkAddress: null,
            AlternativeWorkAddressId: null,
        }).$promise.then(function () {
            workAddressDirty[index] = false;
            $scope.alternativeWorkDistances[index] = 0;
            $scope.alternativeWorkAddresses[index] = "";
            if ($scope.employments[index].AlternativeWorkAddressId != null) {
                Address.delete({ id: $scope.employments[index].AlternativeWorkAddressId }).$promise.then(function () {
                    $rootScope.$emit('PersonalAddressesChanged');
                    $scope.employments[index].AlternativeWorkAddress = null;
                    $scope.employments[index].AlternativeWorkAddressId = null;
                    NotificationService.AutoFadeNotification("success", "", "Afvigende afstand og adresse slettet.");
                });
            } else {
                $rootScope.$emit('PersonalAddressesChanged');
                $scope.employments[index].AlternativeWorkAddress = null;
                $scope.employments[index].AlternativeWorkAddressId = null;
                NotificationService.AutoFadeNotification("success", "", "Afvigende afstand og adresse slettet.");
            }

        });


    }

    $scope.saveAlternativeHomeAddress = function () {
        $timeout(function () {
            handleSaveAltHome();

        });
    }

    var handleSaveAltHome = function () {
        /// <summary>
        /// Handles saving alternative home address.
        /// </summary>
        if ($scope.alternativeHomeAddress.string != undefined && $scope.alternativeHomeAddress.string != null && $scope.alternativeHomeAddress.string != "") {
            var addr = AddressFormatter.fn($scope.alternativeHomeAddress.string);
            if ($scope.alternativeHomeAddress.Id != undefined) {
                PersonalAddress.patch({ id: $scope.alternativeHomeAddress.Id }, {
                    StreetName: addr.StreetName,
                    StreetNumber: addr.StreetNumber,
                    ZipCode: addr.ZipCode,
                    Town: addr.Town,
                    Latitude: "",
                    Longitude: "",
                    Description: "Afvigende hjemmeadresse",
                    Type: "AlternativeHome"
                }).$promise.then(function () {
                    NotificationService.AutoFadeNotification("success", "", "Afvigende hjemmeadresse redigeret.");
                    homeAddressIsDirty = false;
                    $rootScope.$emit('PersonalAddressesChanged');
                });
            } else {
                PersonalAddress.post({
                    StreetName: addr.StreetName,
                    StreetNumber: addr.StreetNumber,
                    ZipCode: addr.ZipCode,
                    Town: addr.Town,
                    Latitude: "",
                    Longitude: "",
                    PersonId: $rootScope.CurrentUser.Id,
                    Type: "AlternativeHome",
                    Description: "Afvigende hjemmeadresse"
                }).$promise.then(function (res) {
                    $scope.alternativeHomeAddress = res;
                    $scope.alternativeHomeAddress.string = res.StreetName + " " + res.StreetNumber + ", " + res.ZipCode + " " + res.Town;
                    NotificationService.AutoFadeNotification("success", "", "Afvigende hjemmeadresse oprettet.");
                    homeAddressIsDirty = false;
                    $rootScope.$emit('PersonalAddressesChanged');
                });
            }
        } else if ($scope.alternativeHomeAddress.string == "" && $scope.alternativeHomeAddress.Id != undefined) {
            $scope.clearHomeClicked();
        }
    }

    $scope.clearHomeClicked = function () {
        /// <summary>
        /// Clears alternative home address.
        /// </summary>
        $scope.alternativeHomeAddress.string = "";
        if ($scope.alternativeHomeAddress.Id != undefined) {
            PersonalAddress.delete({ id: $scope.alternativeHomeAddress.Id }).$promise.then(function () {
                $scope.alternativeHomeAddress = null;
                NotificationService.AutoFadeNotification("success", "", "Afvigende hjemmeadresse slettet.");
                $rootScope.$emit('PersonalAddressesChanged');
            });
        } else {
            NotificationService.AutoFadeNotification("success", "", "Afvigende hjemmeadresse slettet.");
        }
    }

    $scope.homeAddressChanged = function () {
        homeAddressIsDirty = true;
    }

    var checkShouldPrompt = function () {
        /// <summary>
        /// Return true if there are unsaved changes on the page. 
        /// </summary>
        var returnVal = false;
        if ($scope.alternativeHomeAddress != undefined) {
            if (homeAddressIsDirty === true && $scope.alternativeHomeAddress.string != $scope.alternativeHomeAddress.StreetName + " " + $scope.alternativeHomeAddress.StreetNumber + ", " + $scope.alternativeHomeAddress.ZipCode + " " + $scope.alternativeHomeAddress.Town) {
                returnVal = true;
            }
        }
        angular.forEach(workAddressDirty, function (value, key) {
            if (value == true) {
                returnVal = true;
            }
        });
        return returnVal;
    }

    // Alert the user when navigating away from the page if there are unsaved changes.
    $scope.$on('$stateChangeStart', function (event) {
        if (checkShouldPrompt() === true) {
            var answer = confirm("Du har lavet ændringer på siden, der ikke er gemt. Ønsker du at kassere disse ændringer?");
            if (!answer) {
                event.preventDefault();
            }
        }
    });

    window.onbeforeunload = function (e) {
        if (checkShouldPrompt() === true) {
            return "Du har lavet ændringer på siden, der ikke er gemt. Ønsker du at kassere disse ændringer?";
        }
    };

    $scope.$on('$destroy', function () {
        /// <summary>
        /// Unregister refresh event handler when leaving the page.
        /// </summary>
        window.onbeforeunload = undefined;
    });

    $scope.SmartAddress = SmartAdresseSource;

}]);