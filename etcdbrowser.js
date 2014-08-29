
var app = angular.module("app", ["xeditable"]);

app.controller('NodeCtrl', ['$scope','$http', function($scope,$http) {
  var keyPrefix = '/v2/keys',
      statsPrefix = '/v2/stats';
  
  $scope.urlPrefix = "http://localhost:4001";

  $scope.setActiveNode = function(node){
    $scope.activeNode = node;
    if(!node.open){
      $scope.toggleNode(node);
    }else{
      $scope.loadNode(node);
    }
  }

  function errorHandler(data, status, headers, config){
    var message = data;
    if(data.message) {
      message = data.message;
    }
    $scope.error = "Request failed - " + message + " - " + config.url;
  }

  $scope.loadNode = function(node){
    delete $scope.error;
    $http({method: 'GET', url: $scope.urlPrefix + keyPrefix + node.key}).
      success(function(data) {
        prepNodes(data.node.nodes,node);
        node.nodes = data.node.nodes;
      }).
      error(errorHandler);
  }

  $scope.toggleNode = function(node) {
    node.open = !node.open;
    if(node.open){
      $scope.loadNode(node);
    } else {
      node.nodes = [];
    }
  };
  $scope.hasProperties = function(node){
    for(var key in node.nodes){
      if(!node.nodes[key].dir){
        return true;
      }
    }
  }  
  $scope.submit = function(){
    $scope.root = {key:'/'};
    delete $scope.activeNode;
    $scope.loadNode($scope.root);
  }
  $scope.addNode = function(node){
    var name = prompt("Enter Property Name", "");
    var value = prompt("Enter Property value", "");
    if(!name || name == "") return;

    $http({method: 'PUT', 
    	   url: $scope.urlPrefix + keyPrefix + node.key + (node.key != "/" ? "/" : "") + name, 
    	   params: {"value": value}}).
    success(function(data) {
      $scope.loadNode(node);
    }).
    error(errorHandler);
  }

  $scope.updateNode = function(node,value){
    $http({method: 'PUT', 
      url: $scope.urlPrefix + keyPrefix + node.key, 
      params: {"value": value}}).
    success(function(data) {
      $scope.loadNode(node);
    }).
    error(errorHandler);
  }

  $scope.deleteNode = function(node){
    $http({method: 'DELETE', url: $scope.urlPrefix + keyPrefix + node.key}).
    success(function(data) {
      $scope.loadNode(node.parent);
    }).
    error(errorHandler);
  }

  $scope.copyNode = function(node){
    var dirName = prompt("Copy property to directory","/");
    if(!dirName || dirName == "") return;
    dirName = $scope.formatDir(dirName);
    $http({method: 'PUT', 
      url: $scope.urlPrefix + keyPrefix + dirName + node.name, 
      params: {"value": node.value}}).
    error(errorHandler);
  }

  $scope.createDir = function(node){
    var dirName = prompt("Enter Directory Name", "");
    if(!dirName || dirName == "") return;
    $http({method: 'PUT', 
      url: $scope.urlPrefix + keyPrefix + node.key + (node.key != "/" ? "/" : "") + dirName, 
      params: {"dir": true}}).
    success(function(data) {
      $scope.loadNode(node);
    }).
    error(errorHandler);
  }

  $scope.copyDir = function(node){
    var dirName = prompt("Copy properties to directory", "/");
    if(!dirName || dirName == "") return;
    dirName = $scope.formatDir(dirName);
    for(var key in node.nodes){
      $http({method: 'PUT', 
        url: $scope.urlPrefix + keyPrefix + dirName + node.nodes[key].name, 
        params: {"value": node.nodes[key].value}}).
      error(errorHandler);
    }
  }

  $scope.deleteDir = function(node) {
    if(node.nodes && node.nodes.length > 0) {
      alert("Directory Must Be empty (or implement recursive delete...)");
      return;
    }
    if(!confirm("Are you sure you want to delete " + node.key)) return;
    $http({method: 'DELETE', 
      url: $scope.urlPrefix + keyPrefix + node.key + "?dir=true"}).
    success(function(data) {
      $scope.loadNode(node.parent);
    }).
    error(errorHandler);
  }

  $scope.formatDir = function(dirName){
    if(dirName.substr(dirName.trim().length - 1) != '/'){
      dirName += '/';
    }
    return dirName;
  }

  $scope.submit();

  function prepNodes(nodes,parent){
    for(var key in nodes){
      var node = nodes[key];
      var name = node.key.substring(node.key.lastIndexOf("/")+1);
      node.name = name;
      node.parent = parent;
    }
  }
  
  $scope.loadStats = function(){
    console.log("LOAD STATS");
    $scope.stats = {};
    $http({method: 'GET', url: $scope.urlPrefix + statsPrefix + "/store"}).
    success(function(data) {
      $scope.stats.store = JSON.stringify(data, null, " ");
    }).
    error(errorHandler);
    delete $scope.storeStats;
    $http({method: 'GET', url: $scope.urlPrefix + statsPrefix + "/leader"}).
    success(function(data) {
      $scope.stats.leader = JSON.stringify(data, null, " ");
    }).
    error(errorHandler);
    delete $scope.storeStats;
    $http({method: 'GET', url: $scope.urlPrefix + statsPrefix + "/self"}).
    success(function(data) {
      $scope.stats.self = JSON.stringify(data, null, " ");
    }).
    error(errorHandler);
  }

}]);

app.run(function(editableOptions) {
  editableOptions.theme = 'bs3'; 
});

