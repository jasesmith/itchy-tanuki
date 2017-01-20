(function($angular, _) {
  'use strict';

  $angular.module('app').factory('LocalStorage', [function () {
    // get item out of local storage and if it's a string, turn it into a json object
    var get = function(key) {
      var data, item = window.localStorage.getItem(key);
      if (item && _.isString(item) && _.isEmpty(item) === false) {
        data = $angular.fromJson(item);
      } else {
        data = item;
      }
      return data;
    };
    // save object as a json string
    var save = function(key, data) {
      window.localStorage.setItem(key, $angular.toJson(data));
    };
    // remove a specific store
    var remove = function(key) {
      window.localStorage.removeItem(key);
    };
    // blow them all away
    var clearAll = function() {
      window.localStorage.clear();
    };

    return {
      get: get,
      save: save,
      remove: remove,
      clearAll: clearAll
    };
  }]);
})(window.angular, window._);
