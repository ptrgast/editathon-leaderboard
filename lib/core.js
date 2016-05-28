//Create everything under 'eldb' to avoid conflicts with other libraries
if(typeof eldb=="undefined") {window.eldb={};}


////////// Editathon //////////
eldb.Editathon=function(log) {

	this._STOPPED=0;
	this._STARTED=1;
	this._ENDED=2;
	this._REFRESH_PERIOD=60000*4; //ms

	this._log=log|false;
	this._name="editathon";
	this._proxyPath="proxy/proxy.php";
	this._languages=["en"];
	this._users=[];
	this._modules=[];
	this._startTime=0;
	this._endTime=0;
	this._status=this._STOPPED;
	this._timer;
	this._persistenceManager=new eldb._PersistenceManager(this);
	this._delayLine=new eldb._DelayLine(300);

	var thisobj=this;

	this.setLanguages=function(languages) {
		this._languages=[].concat(languages); //force the result to be array
	}

	/** Adds a new user to this Editathon **/
	this.addUser=function(username, persist) {
		if(this._status==this._ENDED) {
			this.log("You can't add or remove users to an ended editathon!");
			return;
		}
		var index=this._findUser(username);
		if(index<0) { //user not found
			var user=new eldb._User(this, username);
			this._users.push(user);
			if(persist!=false) {this._persistenceManager.saveState();}
			this._notifyModules();
			this.log("New user added. (total: "+this._users.length+" users)");
			return true;
		} else { //user already added
			this.log("User already exists in this Editathon.");
			return false;
		}
	}

	/** Returns true on success and false in any other case **/
	this.removeUser=function(username, persist) {
		if(this._status==this._ENDED) {
			this.log("You can't add or remove users to an ended editathon!");
			return;
		}
		var index=this._findUser(username);
		if(index>=0) { //user found
			this._users=this._users.slice(0,index).concat(this._users.slice(index+1));
			if(persist!=false) {this._persistenceManager.saveState();}
			this._notifyModules();
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

	this._attachModule=function(module) {
		//check that the module is not already attached to this editathon
		for(var i=0;i<this._modules.length;i++) {
			if(this._modules[i]==module) {
				this.log("You are trying to attach an already attached module!");
			}
		}
		this._modules.push(module);
		this._notifyModules();
	}

	this._notifyModules=function() {
		for(var i=0;i<this._modules.length;i++) {
			this._modules[i].onDataUpdated(this._users);
		}
	}

	/** Start this Editathon **/
	this.start=function() {
		//update status
		if(this._status==this._STARTED) {return;}
		if(this._status!=this._ENDED) {
			this._status=this._STARTED;
		} else {
			//The editathon is ended. Just start the timer to fetch the results
			this.log("The editathon has ended. Starting just to get the results.");
		}
		//start the timer
		if(this._timer!=null) {this.stop();}
		this._timer=setInterval(thisobj._run, 2000);
		//set the start time (if is not already set)
		if(this._startTime<=0) {this._startTime=new Date().getTime();}
		this._notifyModules();
		this._persistenceManager.saveState();
		this.log("Editathon started. ("+new Date(this._startTime)+")");
	}

	/** Stop this Editathon. You can continue it with a start() **/
	this.stop=function() {
		//update status
		if(this._status==this._STOPPED) {return;}
		if(this._status!=this._ENDED) {
			this._status=this._STOPPED;
		} else {
			//The editathon is ended. Just stop fetching results
			this.log("The editathon has ended. Just stopped fetching results.");
		}
		//stop the timer
		if(this._timer!=null) {
			clearInterval(this._timer);
			this._timer=null;
		}
		this._notifyModules();
		this._persistenceManager.saveState();
		this.log("Editathon stopped. ("+new Date()+")");
	}

	/** End this Editathon **/
	this.end=function() {
			if(this._startTime>0) {
				this._status=this._ENDED;
				//stop the timer
				if(this._timer!=null) {
					clearInterval(this._timer);
					this._timer=null;
				}
				this._endTime=new Date().getTime();
				this._persistenceManager.saveState();
				this._notifyModules();
				this.log("Editathon ended. ("+new Date()+")");
			}
	}

	/** Get everything ready for a new editathon **/
	this.reset=function() {
		this.stop(); //stop the timer
		this._status=this._STOPPED; //force the status to 'STOPPED'
		this._startTime=0; //reset the start time
		this._endTime=0; //reset the end time
		this._users=[]; //clear all users
		this._persistenceManager.clearStoredData(); //clear the stored data
		this._notifyModules();
	}

	/** Handles fetching **/
	this._run=function() {
		var now=new Date().getTime();
		for(var i=0;i<thisobj._users.length;i++) {
			var currentUser=thisobj._users[i];
			var timeElapsed=now-currentUser.lastUpdate;
			if(timeElapsed>thisobj._REFRESH_PERIOD) {
				thisobj.log("Updating user "+currentUser.username+" (last update "+new Date(currentUser.lastUpdate)+")");
				for(var l=0;l<thisobj._languages.length;l++) {
					//var action=function() {}
					//currentUser.requestData(thisobj._languages[l]);
					thisobj._delayLine.add(thisobj._createAction(currentUser, thisobj._languages[l]));
				}
			}
		}
	}

	/** This is a helper function that produces actions for the delay line  **/
	this._createAction=function(user, language) {
		return function() {user.requestData(language);};
	}

	/** This should be used to output messages to the console. **/
	this.log=function(message) {
		if(this._log) {console.log("[eldb] "+message);}
	}

	//retrieve previous editathon state
	this._persistenceManager.retrieveState();

	this.log("Editathon created.");
}

////////// Module //////////
eldb.Module=function() {

	this._editathon=null;

	this._container=document.createElement("div");
	this._container.className="eldb-module";

	this.setEditathon=function(editathon) {
		if(this._editathon!=null) {this._editathon.log("You are trying to reattach an already attached module!");}
		this._editathon=editathon;
		//register this module
		this._editathon._attachModule(this);
	}

	this.onDataUpdated=function(users) {} //every module should override this function


}

////////// _Persistence //////////
eldb._PersistenceManager=function(editathon) {

	this._editathon=editathon;
	this._canStore=true;

	//check that the browser supports data storing
	if(typeof Storage=="undefined") {
		this._editathon.log("Data storage is not supported by this browser!");
		this._canStore==false;
	}

	this.saveState=function() {
		if(!this._canStore) {return;}
		var bundle={};
		bundle.status=this._editathon._status;
		bundle.starttime=this._editathon._startTime;
		bundle.endtime=this._editathon._endTime;
		bundle.users=[];
		for(var i=0;i<this._editathon._users.length;i++) {
			bundle.users.push(this._editathon._users[i].username);
		}
		var jsonBundle=JSON.stringify(bundle);
		localStorage.setItem(this._editathon._name, jsonBundle);
	}

	this.retrieveState=function() {
		if(!this._canStore) {return;}
		var bundle = localStorage.getItem(this._editathon._name);
		if(bundle!=null) {
			//found stored data
			this._editathon.log("Retrieving editathon state...");
			bundle = JSON.parse(bundle);
			this._editathon._startTime = bundle.starttime;
			this._editathon._endTime = bundle.endtime;
			for(var i=0;i<bundle.users.length;i++) {
				this._editathon.addUser(bundle.users[i], false);
			}
			if(bundle.status==this._editathon._STARTED) {
				//If the previous status was 'STARTED' don't set the status variable
				//directly because the start() call will be skipped
				this._editathon._status=this._editathon._STOPPED;
				this._editathon.start();
			} else {
				this._editathon._status=bundle.status;
				if(this._editathon._status==this._editathon._ENDED) {
					this._editathon.start();
				}
			}
		}
	}

	this.clearStoredData=function() {
		if(!this._canStore) {return;}
		localStorage.clear();
	}

}

////////// _DelayLine //////////
eldb._DelayLine=function(delay) {

	var thisobj=this;
	this.buffer=[];
	this.delay=(delay==null||delay<0)?100:delay;
	this.timer=null;

	this.add=function(action) {
		this.buffer.push(action);
		if(this.timer==null) {
			this.timer=setInterval(function() {thisobj._executeNext();}, this.delay);
		}
	}

	this._executeNext=function() {
		var currentAction=this.buffer.shift();
		if(typeof currentAction!="undefined") {
			currentAction();
		}
		if(this.buffer.length==0) {
				clearInterval(this.timer);
				this.timer=null;
		}
	}

}

////////// _User //////////
eldb._User=function(editathon, username) {

	this._editathon=editathon;
	this.username=username;
	this.lastUpdate=0;
	this.articles=[];
	var thisobj=this;

	this.requestData=function(language) {
		this.lastUpdate=new Date().getTime();
		var ajax=new XMLHttpRequest();
		ajax.open("GET",this._editathon._proxyPath+"?lang="+language+"&user="+this.username,true);
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
		var items=rss.getElementsByTagName("item");
		var newArticles=[];
		for(var i=0;i<items.length;i++) {
			var currentItem=items[i];
			var article=new eldb._Article(currentItem);
			//check that the edit took place during the editathon
			if(article.pubDate>=this._editathon._startTime&&(this._editathon._endTime<=0||article.pubDate<=this._editathon._endTime)) {
				newArticles.push(article);
			}
		}
		this._editathon.log(this.username+": "+newArticles.length+" contribution(s) in this editathon ("+items.length+" total contribution(s))");
		this.articles=this._mergeArticles(this.articles, newArticles);
		this._editathon._notifyModules();
	}

	//** Merge article arrays and remove duplicates **//
	this._mergeArticles=function(a, b) {
		var merged=[].concat(a);
		//add articles from a
		for(var i=0;i<a.length;i++)	{
			var articleExists=false;
			for(var j=0;j<merged.length;j++)	{
				if(a[i].title==merged[j].title) {articleExists=true;}
			}
			if(!articleExists) {merged.push(a[i]);}
		}
		//add articles from b
		for(var i=0;i<b.length;i++)	{
			var articleExists=false;
			for(var j=0;j<merged.length;j++)	{
				if(b[i].title==merged[j].title) {articleExists=true;}
			}
			if(!articleExists) {merged.push(b[i]);}
		}
		return merged;
	}

}

////////// _Article //////////
eldb._Article=function(itemElem) {

	//title
	this.title=itemElem.getElementsByTagName("title");
	if(this.title.length>0) {this.title=this.title[0].textContent;}

	//link
	this.link=itemElem.getElementsByTagName("link");
	if(this.link.length>0) {this.link=this.link[0].textContent;}

	//date
	this.pubDate=itemElem.getElementsByTagName("pubDate");
	if(this.pubDate.length>0) {this.pubDate=new Date(this.pubDate[0].textContent).getTime();}

}
