const { remote } = require('electron');
const { dialog } = remote;

insettings = true;

//within function
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

function removeFile(filepath){
	const index = filepaths.indexOf(filepath);
	if(index > -1){
		filepaths.splice(index,1);
	}
	store.set('fps',filepaths);
}

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

function addCategoryFromInput(){
	let input = document.getElementById("addCategoryInput").value;
	createCategory(input,[]);
	HTMLclearCategories();
	displayCategories();
	showDeleteButtons();
	document.getElementById("addCategoryInput").value = "";
	store.set('cts',categories);
}

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

//display already known Files
for(let i = 0; i < filepaths.length; i++){
	newListItem(filepaths[i]);
}


displayCategories()
displayTags();

//show delete buttons on categories


//show delete buttons on tags
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
filterCategory(categories[1].name);
