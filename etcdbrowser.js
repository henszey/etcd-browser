
var app = angular.module("app", ["xeditable"]);

app.controller('NodeCtrl', ['$scope','$http', function($scope,$http) {

  $scope.setActiveNode = function(node){
    $scope.activeNode = node;
    if(!node.open){
      $scope.toggleNode(node);
    }else{
      $scope.loadNode(node);
    }
  }

  function errorHandler(data, status, headers, config){
    $scope.error = "Request failed";
  }

  $scope.urlPrefix = "http://127.0.0.1:4001/v2/keys";
  $scope.loadNode = function(node){
    delete $scope.error;
    $http({method: 'GET', url: $scope.urlPrefix + node.key}).
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
    $.ajax({
        type: "PUT",
        url: $scope.urlPrefix + node.key + (node.key != "/" ? "/" : "") + name,
        data: {"value": value},
        contentType: 'application/x-www-form-urlencoded',
        success: function(){
          $scope.loadNode(node);
        }
    });
  }

  $scope.updateNode = function(node,value){
    $.ajax({
        type: "PUT",
        url: $scope.urlPrefix + node.key,
        data: {"value": value},
        contentType: 'application/x-www-form-urlencoded',
        success: function(){
          $scope.loadNode(node);
        }
    });
  }

  $scope.deleteNode = function(node){
    $.ajax({
        type: "DELETE",
        url: $scope.urlPrefix + node.key,
        contentType: 'application/x-www-form-urlencoded',
        success: function(){
          $scope.loadNode(node.parent);
        }
    });
  }

  $scope.copyNode = function(node){
    var dirName = prompt("Copy property to directory","/");
    if(!dirName || dirName == "") return;
    dirName = $scope.formatDir(dirName);
    $.ajax({
      type: "PUT",
      url: $scope.urlPrefix + dirName + node.name,
      data: {"value": node.value},
      contentType: 'application/x-www-form-urlencoded',
      success: function(){
      }
    });
  }

  $scope.createDir = function(node){
    var dirName = prompt("Enter Directory Name", "");
    if(!dirName || dirName == "") return;
    $.ajax({
        type: "PUT",
        url: $scope.urlPrefix + node.key + (node.key != "/" ? "/" : "") + dirName,
        data: {"dir": true},
        contentType: 'application/x-www-form-urlencoded',
        success: function(){
          $scope.loadNode(node);
        }
    });
  }

  $scope.copyDir = function(node){
    var dirName = prompt("Copy properties to directory", "/");
    if(!dirName || dirName == "") return;
    dirName = $scope.formatDir(dirName);
    for(var key in node.nodes){
      $.ajax({
        type: "PUT",
        url: $scope.urlPrefix + dirName + node.nodes[key].name,
        data: {"value": node.nodes[key].value},
        contentType: 'application/x-www-form-urlencoded',
        success: function(){
        }
      });
    }
  }

  $scope.deleteDir = function(node) {
    if(node.nodes && node.nodes.length > 0) {
      alert("Directory Must Be empty (or implement recursive delete...)");
      return;
    }
    if(!confirm("Are you sure you want to delete " + node.key)) return;
    $.ajax({
      type: "DELETE",
      url: $scope.urlPrefix + node.key + "?dir=true",
      contentType: 'application/x-www-form-urlencoded',
        success: function(){
          $scope.loadNode(node.parent);
        }
    });
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

}]);

app.run(function(editableOptions) {
  editableOptions.theme = 'bs3'; 
});

