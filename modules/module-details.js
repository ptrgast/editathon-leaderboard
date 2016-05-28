ModuleDetails.prototype=new eldb.Module();
ModuleDetails.prototype.constructor=ModuleDetails;
function ModuleDetails() {

	var thisobj=this;

	//articles
	this._articlesContainer=document.createElement("div");
	this._articlesContainer.className="articles";
	this._articlesTitle=document.createElement("div");
	this._articlesTitle.className="title";
	this._articlesTitle.innerHTML="Articles";
	this._articlesContent=document.createElement("div");
	this._articlesContent.className="content";
	this._articlesContainer.appendChild(this._articlesTitle);
	this._articlesContainer.appendChild(this._articlesContent);

	//users
	this._usersContainer=document.createElement("div");
	this._usersContainer.className="users";
	this._usersTitle=document.createElement("div");
	this._usersTitle.className="title";
	this._usersTitle.innerHTML="Contributors";
	this._usersContent=document.createElement("div");
	this._usersContent.className="content";
	this._usersContainer.appendChild(this._usersTitle);
	this._usersContainer.appendChild(this._usersContent);

	this._container.appendChild(this._articlesContainer);
	this._container.appendChild(this._usersContainer);

	this._updateUsersView=function() {
		var users=editathon.getUsers();
		//all
		users=users.sort(this._sortByArticles);
		this._usersContent.innerHTML="";
		for(var i=0;i<users.length;i++) {
			var userElem=document.createElement("a");
			userElem.innerHTML=(i+1)+". "+users[i].username+
			" <span class='edits-counter"+(users[i].articles.length>0?" has-edits":"")+"'>"+users[i].articles.length+"</span>";
			userElem.userId=users[i].id;
			userElem.onmousedown=this._highlightArticles;
			userElem.onmouseup=this._removeHighlighting;
			this._usersContent.appendChild(userElem);
		}
	}

	this._sortByArticles=function(a, b) {
		var aTotal=a.articles.length;
		var bTotal=b.articles.length;
		if(aTotal>bTotal) {return -1;}
		else if(aTotal<bTotal) {return 1;}
		else {return 0;}
	}

	this.onDataUpdated=function(users) {
		var articleLinks="";
		for(var i=0;i<users.length;i++) {
			var currentUser=users[i];
			for(var j=0;j<currentUser.articles.length;j++) {
				articleLinks+="<a class='owner-"+currentUser.id+"' href='"+currentUser.articles[j].link+"' target='_blank'>"+currentUser.articles[j].title+"</a> ";
			}
		}
		this._articlesContent.innerHTML=articleLinks;
		this._updateUsersView();
	}

	this._highlightArticles=function(event) {
		var articleElems=thisobj._articlesContent.getElementsByTagName("a");
		for(var i=0;i<articleElems.length;i++) {
			if(articleElems[i].className.startsWith("owner-"+this.userId)) {
				articleElems[i].className="owner-"+this.userId+" highlight";
			} else if(articleElems[i].className.endsWith("highlight")) {
				articleElems[i].className=articleElems[i].className.substring(0,articleElems[i].className.length-"highlight".length);
			}
		}
	}

	this._removeHighlighting=function(event) {
		var articleElems=thisobj._articlesContent.getElementsByTagName("a");
		for(var i=0;i<articleElems.length;i++) {
			if(articleElems[i].className.endsWith("highlight")) {
				articleElems[i].className=articleElems[i].className.substring(0,articleElems[i].className.length-"highlight".length);
			}
		}
	}

}
