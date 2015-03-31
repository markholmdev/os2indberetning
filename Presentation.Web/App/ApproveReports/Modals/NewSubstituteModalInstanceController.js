﻿angular.module('application').controller('NewSubstituteModalInstanceController',
    ["$scope", "$modalInstance", "persons", "orgUnits", "leader", "Substitute", "Person", "NotificationService", function ($scope, $modalInstance, persons, orgUnits, leader, Substitute, Person, NotificationService) {
        $scope.persons = persons;
        $scope.substituteFromDate = new Date();
        $scope.substituteToDate = new Date();
        $scope.orgUnits = orgUnits;
        $scope.orgUnit = $scope.orgUnits[0];
        
        $scope.personsWithoutLeader = $scope.persons.slice(0); // Clone array;

        // Remove leader from array
        angular.forEach($scope.persons, function (value, key) {
            if (value.Id == leader.Id) {
                $scope.personsWithoutLeader.splice(key, 1);
            }
        });

        $scope.orgUnitSelected = function (id) {
            console.log(id);
        }

        $scope.saveNewSubstitute = function () {
            if ($scope.person == undefined) {
                NotificationService.AutoFadeNotification("danger", "Fejl", "Du skal vælge en person");
                return;
            }

            var sub = new Substitute({
                StartDateTimestamp: Math.floor($scope.substituteFromDate.getTime() / 1000),
                EndDateTimestamp: Math.floor($scope.substituteToDate.getTime() / 1000),
                LeaderId: leader.Id,
                SubId: $scope.person[0].Id,
                OrgUnitId: $scope.orgUnit.Id,
                PersonId: leader.Id
            });

            if ($scope.infinitePeriod) {
                sub.EndDateTimestamp = 9999999999;
            }

            sub.$post(function (data) {
                NotificationService.AutoFadeNotification("success", "Success", "Stedfortræder blev oprettet");
                $modalInstance.close();
            }, function () {
                NotificationService.AutoFadeNotification("danger", "Fejl", "Kunne ikke oprette stedfortræder");
            });
        };

        $scope.cancelNewSubstitute = function () {
            $modalInstance.dismiss('cancel');
        };
    }]);