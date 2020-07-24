const path = require('path');
const fs = require('fs');
const { ipcRenderer } = require('electron');
const Store = require('./store.js');


ipcRenderer.on('ondragstart', (event, filePath) => {
	console.log("STARTING DRAG");
 	event.sender.startDrag({
		file: filePath,
		icon: '/Users/athervgole/Comp Sci/Personal Projects/sampleElectronApp/my-app/src/download.png'
  	})
})

let defaultCategory = {
	name : "All",
	tags: [],

	addTags(taglist){
		self.tags = [...self.tags, ...taglist];
	}
}

const store = new Store({
	configName: 'preferences',
	defaults: {
		fps : [],
		cts : [defaultCategory]
	}
});


//const filepaths = ["/Users/athervgole/Comp Sci/Personal Projects/sampleElectronApp/lofitri", "/Users/athervgole/Comp Sci/Personal Projects/sampleElectronApp/lofitest2"];
//const categories = [];
let filepaths = store.get('fps');
let categories = store.get('cts');

let subpaths = [];

let activeCategory = "All";


//create main sample list
const sampleList = {
	list: [],
	add: function(sample){
		this.list.push(sample);
	},
	length: function(){
		return this.list.length;
	},
	deleteAll: function(){
		while(this.list.length > 0){
			this.list.pop();
		}
	}
}

//function to create category given name (eg Vocals);
function createCategory(name, tags){
	let category = {
		name : name,
		tags: tags,

		addTags(taglist){
			self.tags = [...self.tags, ...taglist];
		}
	}
	categories.push(category);
}

//function to generate tags given dirent.name (eg Cymatics Clap.wav);
function generateTags(filename){
	let lowercase = filename.toLowerCase();
	const tokenized = lowercase.split(" ").join(",").split("-").join(",").split("_").join(",").split(",");
	let tags = [];
	for(let i = 0; i < categories.length; i++){
		let catTags = categories[i].tags;
		let intersection = catTags.filter(x => tokenized.includes(x));
		tags = [...tags, ...intersection];
	}
	return tags;
}

//function to create sample object given filepath (eg create object with name Cymatics Clap.wav given users/[name].../Cymatics Clap.wav)
function returnSampleObj(filepath, tags){
	let sample = {
		name: path.basename(filepath),
		filepath: filepath,
		tags: tags,

		addTags(taglist){
			self.tags = [...self.tags, ...taglist];
		}
	}
	return sample;
}

//given user inputted filepaths, generate list of all subfolders within filepaths
function generateSubPaths(){
	subpaths = [];
	function flatten(lists) {
	  return lists.reduce((a, b) => a.concat(b), []);
	}

	function getDirectories(srcpath) {
	  return fs.readdirSync(srcpath)
	    .map(file => path.join(srcpath, file))
	    .filter(path => fs.statSync(path).isDirectory());
	}

	function getDirectoriesRecursive(srcpath) {
	  return [srcpath, ...flatten(getDirectories(srcpath).map(getDirectoriesRecursive))];
	}

	for(let i = 0; i < filepaths.length; i++){
		subpaths = [...subpaths, ...getDirectoriesRecursive(filepaths[i])];
	}
}

//use all sub directories to fill sampleList with tagged sample objects
function loadSamples(){
	for (let i = 0; i < subpaths.length; i ++){
		const dir = fs.opendirSync(subpaths[i]);
		let dirent;
		while ((dirent = dir.readSync()) !== null) {
			ext = dirent.name.split('.').pop();
			if(ext === "wav" || ext === "mp3"){
	  			let fullpath = "" + subpaths[i] + "/" + dirent.name;
				let tags = generateTags(dirent.name);
				let sample = returnSampleObj(fullpath, tags);
				sampleList.add(sample);
			}
		}
		dir.closeSync();
	}
	console.log("in scan");
}

//display sample list with play buttons appended
function displayList(){
	for(let i = 0; i < sampleList.length(); i ++){
		//handle <a> link
		let a = document.createElement("a");
		a.href = "#";
		a.ondragstart = (event) => {
			event.preventDefault()
			ipcRenderer.send('ondragstart',sampleList.list[i].filepath)
		}
		a.innerHTML = "" + sampleList.list[i].name;
		a.id = "sampleText";
		a.className = "align-middle"
		//handle "text" button
		let text = document.createElement("button");
		text.type = "button";
		text.className = "btn btn-outline-dark";
		text.innerHTML = "\u25B6";
		//handle "play" <span>
		let span = document.createElement("span");
		span.className = "play";
		span.appendChild(text);
		//handle li element
		let li = document.createElement("li");
		li.className = "list-group-item";
		li.appendChild(span);
		li.appendChild(a);
		li.setAttribute("data-active", "true");
		li.setAttribute("data-showing","true");
		document.getElementById("sampleList").appendChild(li);
	}
	addPlayButton();
}

function displayCategories(){
	for(let i = 0; i < categories.length; i ++){
		let li = document.createElement("li");

		let btn = document.createElement("button");
		btn.type = "button";
		btn.className = "btn btn-outline-dark";
		let name = categories[i].name;
		btn.innerHTML = name;
		btn.onclick = function(){
			filterCategory(name);
		}
		let closebtn = document.createElement("button");
		closebtn.type = "button";
		closebtn.className = "btn btn-outline-danger categoryDeleteBtn";
		closebtn.innerHTML = "\u00D7";
		closebtn.onclick = function(){
			categories.splice(i,1);
			li.style.display = "none";
		}
		closebtn.style.display = "none";
		li.className = "list-group-item";
		li.appendChild(closebtn);
		li.appendChild(btn);
		document.getElementById("categoryList").appendChild(li);
	}
}

function displayTags(){
	for(let x = 0; x < categories.length; x ++){
		let currentTags = categories[x].tags;
		for(let i = 0; i < currentTags.length; i++){
			let li = document.createElement("li");
			let div = document.createElement("div");
			div.setAttribute("class", "custom-control custom-switch");
			let input = document.createElement("input");
			input.setAttribute("type","checkbox");
			input.setAttribute("class","custom-control-input");
			let id = "tag" + currentTags[i];
			input.setAttribute("id",id);
			input.onclick = function(){
				filterTag(currentTags[i]);
			}

			let closebtn = document.createElement("button");
			closebtn.type = "button";
			closebtn.className = "btn btn-outline-danger btn-sm float-right tagDeleteBtn";
			closebtn.innerHTML = "\u00D7";
			closebtn.onclick = function(){
				categories[x].tags.splice(i,1);
				li.style.display = "none";
			}
			closebtn.style.display = "none";

			let label = document.createElement("label");
			label.setAttribute("class","custom-control-label");
			label.setAttribute("for",id);
			label.innerHTML = currentTags[i];

			div.appendChild(input);
			div.appendChild(label);
			div.appendChild(closebtn);

			li.className = "list-group-item";
			li.id = "" + currentTags[i];
			li.appendChild(div);
			document.getElementById("tagList").appendChild(li);
		}
	}
}


//add play functionality to each <a> link to sample

let globalPlayingAudio = new Audio();
let globalPlayingFilepath;
function playAudio(audio){ //takes Audio filepath
	if(globalPlayingAudio.paused){ //if theres nothing playing
		globalPlayingFilepath = audio;
		globalPlayingAudio = new Audio(globalPlayingFilepath); //set to audio
		globalPlayingAudio.play(); //play audio
	}
	else if(globalPlayingFilepath === audio){ //if clicking play on audio already playing
		globalPlayingAudio.pause(); //pause audio
	}
	else{ //if clicking play on something other than playing
		globalPlayingAudio.pause(); //pause currently playing
		globalPlayingFilepath = audio;
		globalPlayingAudio = new Audio(globalPlayingFilepath); //set to new audio
		globalPlayingAudio.play(); //play new audio
	}
}

function addPlayButton(){
	let play = document.getElementsByClassName("play");
	for(let i = 0; i < sampleList.length(); i++){
		play[i].onclick = function(){
			let sound = sampleList.list[i].filepath;
			playAudio(sound);
		}
	}
}

function htmlClearAll(){
	resetTags();
	HTMLclearTags();
	HTMLclearCategories();
	HTMLclearSampleList();
}

function HTMLclearSampleList(){
	if(document.getElementById("sampleList")){
		let parent = document.getElementById("sampleList");
		while(parent.firstChild){
			parent.removeChild(parent.firstChild);
		}
	}
}

function HTMLclearCategories(){
	let catParent = document.getElementById("categoryList");
	while(catParent.firstChild){
		catParent.removeChild(catParent.firstChild);
	}
}

function HTMLclearTags(){
	let tagParent = document.getElementById("tagList");
	while(tagParent.firstChild){
		tagParent.removeChild(tagParent.firstChild);
	}
}

function resetTags(){
	currentTagsApplied = 0;
	let li = [];
	if(document.getElementById("sampleList")){
		let ul = document.getElementById("sampleList");
		let li = ul.getElementsByTagName("li");
	}
	for(i = 0; i < li.length; i ++){
		li[i].setAttribute("data-active","true");
		li[i].setAttribute("data-showing", "true");
		li[i].style.display = "";
	}
	for (let i = 0; i < categories.length; i++){
		for(let j = 0; j < categories[i].tags.length; j++){
			id = "tag" + categories[i].tags[j];
			if(document.getElementById(id)){
				document.getElementById(id).checked = false;
			}
		}
	}
}

function filterCategory(category){ //takes category name
	console.log("filtering category " + category);
	resetTags();
	activeCategory = category;
	let li = [];
	if(document.getElementById("sampleList")){
		let ul = document.getElementById("sampleList");
		li = ul.getElementsByTagName("li");
	}
	let cat = categories.find(element => element.name === category);
	let ctags = cat.tags; //tags for category [i]
	for(let i = 0; i < li.length; i ++){ //for every sample in sampleList
		let itags = sampleList.list[i].tags; //tags for sample [i]
		//if no tags intersect between sample and category, hide li[i]
		let intersection = itags.filter(x => ctags.includes(x));
		if(category === "All"){ //ALL category
			if(intersection.length === 0){
				li[i].style.display = "";
				li[i].setAttribute("data-active", "true");
			}
			else{
				li[i].style.display = "none";
				li[i].setAttribute("data-active", "false");
			}
		}
		else { //if theres no tag intersection, hide - false, otherwise, show - true
			if(intersection.length === 0){
				li[i].style.display = "none";
				li[i].setAttribute("data-active", "false");
			}
			else{
				li[i].style.display = "";
				li[i].setAttribute("data-active", "true");
			}
		}
	}
	//this shows and hides the correct tags for each category
	let tul = document.getElementById("tagList");
	let tli = tul.getElementsByTagName("li");
	for(let i = 0; i < tli.length; i ++){
		if(ctags.includes(tli[i].id) || category === "All"){
			tli[i].style.display = "";
		}
		else{
			tli[i].style.display = "none";
		}
	}
	document.getElementById("categoryTitle").innerHTML = category;
}

let currentTagsApplied = 0;
function filterTag(tag){
	let id = "tag" + tag;
	let unfilter = !(document.getElementById(id).checked); //removing a filter T/F
	if(!unfilter){ //if adding a filter
		currentTagsApplied++ //current tags ++
	}
	else{ //if removing a filter
		currentTagsApplied--; //current tags --
	}
	let singletag = [tag];
	let ul = document.getElementById("sampleList");
	let li = ul.getElementsByTagName("li");
	for(let i = 0; i < li.length; i++){ //for every sample in sampleList
		let itags = sampleList.list[i].tags; //tags for sample[i]
		let intersection = singletag.filter(x => itags.includes(x));
		if(!unfilter && li[i].getAttribute("data-active") === "true"){ //if adding a filter
			//if its the only filter active, hide all first, then show relevant
			if(currentTagsApplied === 1){
				li[i].style.display = "none";
				li[i].setAttribute("data-showing","false");
			}
			if(intersection.length > 0){
				li[i].style.display = "";
				li[i].setAttribute("data-showing","true");
			}
		}
		//if removing a filter
		else if(unfilter && li[i].getAttribute("data-active") === "true"){
			//if its the only filter active, hide relevant first, then show all
			if(intersection.length > 0){
				li[i].style.display = "none"; //hide it
				li[i].setAttribute("data-showing","false");
			}
			if(currentTagsApplied === 0){
				li[i].style.display = "";
				li[i].setAttribute("data-showing","true");
			}
		}
	}
	search();
}

function search(){
	let input = document.getElementById("searchBar");
	let filter = input.value.toUpperCase();
	let ul = document.getElementById("sampleList");
	let li = ul.getElementsByTagName('li');
	for(let i = 0; i < li.length; i ++){
		a = li[i].getElementsByTagName("a")[0];
		let txtValue = a.innerHTML.split(".")[0];
		if(txtValue.toUpperCase().indexOf(filter) > -1){
			if(li[i].getAttribute("data-active") === "true" && li[i].getAttribute("data-showing") === "true"){
				li[i].style.display = ""
			}
		}
		else{
			if(li[i].getAttribute("data-active") === "true" && li[i].getAttribute("data-showing") === "true"){
				li[i].style.display = "none";
			}
		}
	}
}

function initScan(){
	sampleList.deleteAll();
	htmlClearAll();
	generateSubPaths()
	loadSamples();
	displayList();
	displayCategories();
	displayTags();
}

/*createCategory("All",[]);
createCategory("Drums",["clap","snare","rim","hat","crash","cymbal","kick","click"]);
createCategory("Vocals",["vocal","vocals"]);
createCategory("FX",["noise"]);*/


//NEED TO ADD RESET TAGS ON CATEGORY SWITCH
