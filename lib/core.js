//Create everything under 'eldb' to avoid conflicts with other libraries
if(typeof eldb=="undefined") {window.eldb={};}


////////// Editathon //////////
eldb.Editathon=function(log) {
	
	this._STOPPED=0;
	this._STARTED=1;
	
	this._log=log|false;
	this._proxyPath="proxy/proxy.php";
	this._languages=[];
	this._users=[];
	this._status=this._STOPPED;
	this._timer;
	
	this.setLanguages=function(languages) {
		this._languages=[].concat(languages);
	}
	
	/** Adds a new user to this Editathon **/
	this.addUser=function(username) {
		var index=this._findUser(username);
		if(index<0) { //user not found
			var user=new eldb._User(this, username);
			this._users.push(user);
			this.log("New user added. (total: "+this._users.length+" users)");
			return true;
		} else { //user already added
			this.log("User already exists in this Editathon.");
			return false;					
		}
	}
	
	/** Returns true on success and false in any other case **/
	this.removeUser=function(username) {
		var index=this._findUser(username);
		if(index>=0) { //user found
			this._users=this._users.slice(0,index).concat(this._users.slice(index+1));
			this.log("User removed. (total: "+this._users.length+" users)");
			return true;
		} else { //user not found
			this.log("The requested username was not found in this Editathon.");
			return false;			
		}
	}
	
	/** Returns the index of a user in the _users array or -1 if the user is not in the array. **/
	this._findUser=function(username) {
		for(var i=0;i<this._users.length;i++) {
			if(username==this._users[i].username) {return i;}
		}
		return -1;
	}
	
	this.getUsers=function() {
		return this._users;
	}
	
	/** Start this Editathon **/
	this.start=function() {
		if(this._status==this._STARTED) {return;}
		this._status=this._STARTED;
		this.log("Editathon started. ("+new Date()+")");
	}

	/** Stop this Editathon **/
	this.stop=function() {
		if(this._status==this._STOPPED) {return;}
		this._status=this._STOPPED;
		this.log("Editathon stopped. ("+new Date()+")");
	}
		
	/** This should be used to output messages to the console. **/
	this.log=function(message) {
		if(this._log) {console.log("[eldb] "+message);}
	}
	
	this.log("Editathon created.");	
}

////////// Module //////////
eldb.Module=function(editathon) {
	
	this._editathon=editathon;
	
	this.attachTo=function(editathon) {
		this._editathon=editathon;
	}
	
}

////////// _User //////////
eldb._User=function(editathon, username) {

	this._editathon=editathon;
	this.username=username;
	this.lastUpdate=0;
	var thisobj=this;

	this.requestData=function() {
		var ajax=new XMLHttpRequest();
		ajax.open("GET",this._editathon._proxyPath+"?lang=en&user="+this.username,true);
		ajax.onreadystatechange=function() {
			if(ajax.readyState==4 && ajax.status==200) {
				thisobj._handleData(ajax.responseText);
			}		
		}
		ajax.send();
	}
	
	this._handleData=function(data) {
		var parser=new DOMParser();
		var rss=parser.parseFromString(data,"application/xml");
		console.log(rss);
		var items=rss.getElementsByTagName("item");
		for(var i=0;i<items.length;i++) {
			var currentItem=items[i];
			var article=new eldb._Article(currentItem);
			console.log(article);
		}
	}

}

////////// _Article //////////
eldb._Article=function(itemElem) {
	
	//title
	this.title=itemElem.getElementsByTagName("title");
	if(this.title.length>0) {this.title=this.title[0].textContent;}

	//link
	this.link=itemElem.getElementsByTagName("comments");
	if(this.link.length>0) {this.link=this.link[0].textContent;}

	//date
	this.pubDate=itemElem.getElementsByTagName("pubDate");
	if(this.pubDate.length>0) {this.pubDate=new Date(this.pubDate[0].textContent);}

}
