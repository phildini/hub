var ngHub = angular.module('hubSearch', ['LiveSearch']);

ngHub.factory('pagesPromise', function($http, $q) {
  // TODO fix against site.baseurl
  return $http.get('api/v1/pages.json').then(function(response) {
    return response.data.entries;
  });
});

ngHub.factory('pagesByUrl', function(pagesPromise) {
  var result = {};

  pagesPromise.then(function(docs) {
    angular.forEach(docs, function(doc) {
      result[doc.url] = doc;
    });
  });

  return result;
});

ngHub.factory('pageIndex', function(pagesPromise) {
  var index = lunr(function() {
    this.ref('url');

    this.field('title', {boost: 10});
    this.field('url', {boost: 5});
    this.field('body');
  });

  pagesPromise.then(function(docs) {
    angular.forEach(docs, function(page) {
      index.add(page);
    });
  });

  return index;
});

ngHub.factory('pagesSearch', function($filter, pagesByUrl, pageIndex) {
  return function(term) {
    var results = pageIndex.search(term);
    results = $filter('limitTo')(results, 20);
    angular.forEach(results, function(result) {
      var page = pagesByUrl[result.ref];
      result.page = page;
      // make top-level attribute available for LiveSearch
      result.title = page.title;
    });
    return results;
  };
});

ngHub.controller('SearchController', function($scope, $q, pagesSearch) {
  $scope.searchCallback = function(params) {
    var defer = $q.defer();
    var results = pagesSearch(params.query);
    defer.resolve(results);
    return defer.promise;
  };
});