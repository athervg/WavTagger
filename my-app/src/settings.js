const { remote } = require('electron');
const { dialog } = remote;


//handles user adding files to searchable paths (global filepaths)
function addFile(){
	console.log("filepaths before : $$ " + filepaths);
	const filepath = dialog.showOpenDialogSync({properties: ['openDirectory']}) || null;
	if (filepath != null){
		fp = filepath[0];
		if(!filepaths.includes(fp)){
			filepaths.push(fp);
			newListItem(fp);
		}
	}
	//store.set('fps',filepaths);
	console.log("filepaths after : $$ " + filepaths);
	store.set('fps',filepaths);
}

//handles user deleting files from searchable paths
function removeFile(filepath){
	const index = filepaths.indexOf(filepath);
	if(index > -1){
		filepaths.splice(index,1);
	}
	store.set('fps',filepaths);
}

//handles adding filepaths to HTML list of active searchable files
function newListItem(filepath){
	let li = document.createElement("li");
	let t = document.createElement("div");
	t.className = "align-middle";
	t.innerHTML = (" " + filepath);
	t.id = "filepathText";

	let button = document.createElement("button");
	button.type = "button";
	button.className = "btn btn-outline-danger";
	button.innerHTML = "\u00D7";
	button.onclick = function(){
		removeFile(filepath);
		this.parentElement.style.display = "none";
	}

	li.appendChild(button);
	li.appendChild(t);

	ul = document.getElementById("fileList")
	ul.appendChild(li);

}

//display active searchable files
for(let i = 0; i < filepaths.length; i++){
	newListItem(filepaths[i]);
}

//handles custom category creation (including refreshing category list and delete buttons)
function addCategoryFromInput(){
	let input = document.getElementById("addCategoryInput").value;
	createCategory(input,[]);
	HTMLclearCategories();
	displayCategories();
	showDeleteButtons();
	document.getElementById("addCategoryInput").value = "";
	store.set('cts',categories);
}

//handles custom tag creation (within category)
function addTagFromInput(){
	let input = document.getElementById("addTagInput").value;
	console.log("active category is " + activeCategory);
	for(let i = 0; i < categories.length; i++){
		console.log("checking category " + categories[i].name);
		if (categories[i].name === activeCategory){
			categories[i].tags.push(input);
			console.log("added " + input + " to category " + categories[i].name);
			break;
		}
	}
	HTMLclearTags();
	displayTags();
	filterCategory(activeCategory);
	showDeleteButtons();
	document.getElementById("addTagInput").value = "";
	store.set('cts',categories);
}


//on opening settings, refresh/redisplay categories & tags
displayCategories()
displayTags();


//on opening settings, show delete buttons on tags and categories
function showDeleteButtons(){
	let tagDeleteButtons = document.getElementsByClassName("tagDeleteBtn");
	for(let i = 0; i < tagDeleteButtons.length; i++){
		tagDeleteButtons[i].style.display = "";
	}
	let catDeleteButtons = document.getElementsByClassName("categoryDeleteBtn");
	for(let i = 0; i < catDeleteButtons.length; i++){
		catDeleteButtons[i].style.display = "";
	}
}


showDeleteButtons();
filterCategory(categories[1].name); //filters by first category in list by default for editing purposes
