/*
	This is a list of all POI in my neighborhood including my neighborhood.
	For simplicity, the names and location (latitude and longitude) for each POI are also made available in the POI data.
	This is the Model for my MVO.
*/

var POI = [
	["Valley Ranch","32.9359457", "-96.95849220000002"],
	["Dallas","32.7766642","-96.79698789999998"],
	["Six Flags Over Texas","32.75565","-97.07252"],
	["Irving Convention Center at Las Colinas","32.878001","-96.94310100000001"],
	["William Blair Jr. Park","32.731994","-96.736019"],
	["Cotton Bowl Stadium","32.779018","-96.76033100000001"],
	["Dallas Arboretum and Botanical Garden","32.823031","-96.71690699999999"],
	["AT&T Stadium","32.747284","-97.094494"]
];
/*
	This array is a global variable and it purpose is to hold each Marker Object that was created.
	Later in the code, we will iterate over the array to clear all markers when the ko computed observable gets updated.
*/
var marks = [];

/*
	Actual Marker function, that will create initiated each time a new marker has to be created.
	This function takes in an array with 3 pieces of data (name, lat, lng) and the map object.
	This function also creates an info Window object for a marker.
*/
var MapMarker = function(loc,map){
/*
	This creates a google location object required by the markers. It takes in the latitude and longitude as parameters.
*/
	var myLatLng = new google.maps.LatLng(loc[1], loc[2]);

/*
	This is the code that actually creates the marker in the map.
	At a minimum, the marker object needs the map and google location object to create the map.
	Optionally, we can add title (on mouse hover over the marker) and animation.
*/
	var marker = new google.maps.Marker({
		position: myLatLng,
		map: map,
		animation: google.maps.Animation.DROP,
		title: loc[0]
	});


/*
	This is the 3rd party API call to MediaAPI (parent of Wikipedia).
	On successful return of data from 3rd party site, we are creating infoWindow object for the marker.
*/
	var getWikipedia = function(search){
		var result = "";
		var wikipediaURL = "http://en.wikipedia.org/w/api.php?format=json&callback=wikiCallback&action=opensearch&search="+encodeURIComponent(search);
		$.ajax({
			url: wikipediaURL,
			dataType: 'jsonp',
			success: function(data){
/*
	We are reading specific areas of the results back to create our own content to display.
	The results vary based on the search but the search always returns the keyword searched.
	We are accomodating for situations when data is not available and we will not display an infoWindow if the search was unsuccessful. Instead we are returning the error back.
*/
				var content = "<h3>Results from Wikipedia for: "+data[0]+"</h3>";
				var heading 	= (data[1][0])? "<h1>"+data[1][0]+"</h1>":"";
				var description = (data[2][0])? "<p>"+data[2][0]+"</p>":"<p>No description available</p>";
				var URL 		= (data[3][0])? "<a href='"+data[3][0]+"'>"+data[3][0]+"</a>":"<p>No URL available</p>";
				content += heading + description + URL;
/*
	This is where we are creating new infoWindow and then later we will associate them with the markers on a map.
	The infoWindow opens when either the list is selected or when the marker is selected.
*/
				var infoWindow = new google.maps.InfoWindow({
				  content: content
				});

				google.maps.event.addListener(marker, 'click', function(){
					infoWindow.open(map, marker);
				});
				infoWindow.open(map, marker);
			},
			error: function(e){
				console.log(e);
			}
		});
	};
	getWikipedia(loc[0]);
/*
	The following lines of code is borrowed from Project#2 and these lines allow to set the boundary for the map and center the map based on the markers on the map.
*/
	var bounds = window.mapBounds;
	bounds.extend(myLatLng); // takes in a map location object
	map.fitBounds(bounds);
	map.setCenter(bounds.getCenter());
/*
	This adds the newly created marker object into an array so we can clear the markers when drawing new ones when the ko computed variable gets updated.
*/
	marks.push(marker);
};

var ViewModel = function(){
/*
	This is the observableArray for the data.
*/
	this.names = ko.observableArray(POI);
/*
	The Google Map v3 requires a center and zoom data for initial map creation.
	Additionally, I have added to disable the default UI on the map.
*/
	var mapOptions = {
		center: { lat: 32.93, lng: -96.95},
		zoom: 11,
		disableDefaultUI: true
	};

/*
	This actually creates the map and assigns the map object to the variable.
	We have also created a global variable mapBounds to get the boundary for the map. This is from Project#2 map code.
*/
	var map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);
	window.mapBounds = new google.maps.LatLngBounds();

/*
	This variable keeps track of the filter List displayed on the map.
	This is binded with the checkboxes
*/
	this.filter = ko.observableArray();

/*
	This computed function runs each time a checkbox is selected or if a selected checkbox is removed due to search.
	The function first clears all markers and then initiates new markers on the map based on checkbox selection.
*/
	this.markers = ko.computed(function(){
		for (var j = 0; j < marks.length; j++){
			marks[j].setMap(null);
		}
		for (var i = 0; i < this.filter().length; i++) {
			var loc = this.filter()[i].split(',');
			new MapMarker(loc,map);
		}
		return;
	}, this);

/*
	This is binded with the textbox. The initial value is set as blank.
	The idea behind this was textbox and form used was from KnockoutJS documentation
	http://knockoutjs.com/examples/betterList.html
*/
	this.itemToSearch = ko.observable("");

/*
	The search function is binded with the search form submit action.
	The search compares the text against the POI observableArray.
	If a match is found the index is of a value higher than -1.
*/
	this.searchPOI = function(){
		var removeIndex = [];
		for(var i=0; i < this.names().length; i++){
			var POIdata = this.names()[i].join();
			var index = POIdata.toLowerCase().indexOf(this.itemToSearch().toLowerCase());
			if(index < 0){
/*
	We remove any checked checkboxes from the result and
	save the index of the POI to remove it.
	Removing now will make the index variable and we want to avoid that.
*/
				this.filter.remove(POIdata);
				removeIndex.push(i);
			}
		}
/*
	We reverse the index (from high to low) so we can remove it from the array without effecting the other indexes to the array element.
	Then we remove it using a forloop function.
*/
		removeIndex.reverse();
		for(var i=0; i<removeIndex.length; i++){
			this.names.splice(removeIndex[i], 1);
		}
		this.itemToSearch("");
	};
};

ko.applyBindings(new ViewModel());
