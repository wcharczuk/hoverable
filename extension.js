var Hoverable = (function(){

	var mediaTypes = {
		invalid : "invalid",
		image : "img",
		album : "album",
		video : "video",
		audio : "audio"
	};

	var hvr = {};

	hvr.ValidTags = ['A', 'IMG', 'AUDIO', 'VIDEO']

	hvr.showTimer = {};
	hvr.hideTimer = {};
	hvr.albumTimer = {};

	hvr.Options = {
		padding : 0,
		delay : 400,
	};

	hvr.Mouse = {};

	hvr.container 	= $('<div class="hoverable-container"></div>');
	hvr.media 		= $('<div class="hoverable-media"></div>');
	hvr.loader 		= $('<div class="hoverable-loader"></div>');
	hvr.img 		= $('<div class="hoverable-image"/>');


	hvr.hide = function() {
		cancelAllTimers();
		$(hvr.loader).show();
		$(hvr.img).hide();
		$(hvr.container).hide();
	};

	hvr.show = function(media) {
		$(hvr.img).empty();
		$(hvr.img).hide();
		$(hvr.loader).show();

		switch(media.type) {
			case mediaTypes.image:
				{
					hvr.showImage(media);
				}
				break;
			case mediaTypes.album:
				{
					hvr.showAlbum(media);
				}
				break;
		}

		$(hvr.container).show();
		hvr.positionContainer();
	};

	hvr.showImage = function(media) {
		var image = new Image();
		$(image).on("load", function() {
			$(hvr.loader).hide();
			$(hvr.img).data("height", image.height);
			$(hvr.img).data("width", image.width);
			$(hvr.img).append(image);
			$(hvr.img).show();
			hvr.positionContainer();
		});
		$(image).attr('src', media.src);
	}

	var arrayToCsv = function(targetArray) {
		var encoded_pieces = [];
		for(var i = 0; i < targetArray.length; i++) {
			encoded_pieces.push(encodeURIComponent(targetArray[i]));
		}
		return encoded_pieces.join(",");
	};

	var csvToArray = function(csv) {
		var pieces = csv.split(',');
		var decoded_pieces = [];
		for(var i = 0; i < pieces.length; i++) {
			var decoded = decodeURIComponent(pieces[i]);
			decoded_pieces.push(decoded);
		}
		return decoded_pieces;
	};

	hvr.showAlbum = function(media) {
		//set up the album
		$(hvr.img).data("album", arrayToCsv(media.images));

		//set up the first image.
		var firstImage = new Image();
		$(firstImage).on("load", function() {
			$(hvr.loader).hide();
			$(hvr.img).data("height", firstImage.height);
			$(hvr.img).data("width", firstImage.width);
			$(hvr.img).append(firstImage);
			$(hvr.img).show();
			hvr.positionContainer();
			hvr.albumTimer = setTimeout(hvr.advanceAlbumIndex, 1500);
		});
		$(firstImage).attr('src', media.images[0]);

		$(hvr.img).data("album-length", media.images.length);
		$(hvr.img).data("album-index", 0);
	};

	hvr.advanceAlbumIndex = function() {
		var current_index = parseInt($(hvr.img).data("album-index"));
		var albumLength = parseInt($(hvr.img).data("album-length"));

		current_index = current_index + 1;

		if( current_index >= albumLength ) {
			current_index = 0;
		}

		$(hvr.img).data("album-index", current_index);

		//handle swapping the actual images.
		var image = $(hvr.img).find("img")[current_index];

		if(image) {
			$(hvr.img).find("img").hide();
			$(image).show();
		} else {
			var album = csvToArray($(hvr.img).data("album"));
			var src = album[current_index];
			image = new Image();
			$(image).on("load", function() {
				$(hvr.img).find("img").hide();
				$(hvr.img).data("height", image.height);
				$(hvr.img).data("width", image.width);
				$(hvr.img).append(image);
				$(image).show();
				hvr.positionContainer();
			});
			$(image).attr('src', src);
		}

		hvr.albumTimer = setTimeout(hvr.advanceAlbumIndex, 1500);
	};

	hvr.positionContainer = function() {
		var padding = 50;

		var window_width = $(window).width();
		var window_height = $(window).height();

		var image_height = $(hvr.loader).height();
		var image_width = $(hvr.loader).width();

		if($(hvr.img).css('display') !== 'none') { //if the image is showing
			image_height = $(hvr.img).data("height");
			image_width = $(hvr.img).data("width");
		}

		var landscape = image_height < image_width;

		var scrollTop = $(window).scrollTop();

		var mouse_x = hvr.Mouse.x;
		var mouse_y = hvr.Mouse.y - scrollTop;

		var window_width_buffer_left = window_width - (window_width - mouse_x);
		var window_width_buffer_right = window_width - mouse_x;

		var window_height_buffer_up = window_height - (window_height - mouse_y);
		var window_height_buffer_down = window_height - mouse_y;

		var window_x_mid = window_width >> 1; //div by 2
		var window_y_mid = window_height >> 1; //div by 2

		var max_width = window_width;
		var max_height = window_height;

		var left = null;
		var top = null;
		var right = null;
		var bottom = null;

		var aspect_ratio = image_width / image_height;

		var orient_up = mouse_y > window_y_mid; 
		var orient_left = mouse_x > window_x_mid;

		var height_buffer = window_height_buffer_down;
		if(orient_up) {
			height_buffer = window_height_buffer_up;
		}

		var width_buffer = window_width_buffer_right;
		if(orient_left) {
			width_buffer = window_width_buffer_left
		}

		var final_width = image_width;
		var final_height = image_height;

		if (landscape) { //means we care about fitting the width more than the height. 
			if(image_width > width_buffer) final_width = width_buffer - padding;

			final_height = final_width / aspect_ratio;
		} else { //portrait mode bitches.
			if (image_height > window_height) final_height = window_height;
			final_width = final_height * aspect_ratio;

			if(final_width > width_buffer) {
				final_width = width_buffer - padding;
				final_height = final_width / aspect_ratio;
			}
		}

		var final_height_half = final_height >> 1; //we only really care about this one.
		var final_width_half = final_width >> 1;

		if(landscape) {
			if(orient_left) left = mouse_x - (final_width + padding);
			else 			left = mouse_x + padding;
			
			if(final_height >= window_height) 	top = 0;
			else 								top =  mouse_y - final_height_half;

		} else { //portrait
			if(image_height > window_height) 	top = 0;
			else 								top = mouse_y - final_height_half;

			if(orient_left) left = mouse_x - (final_width + padding);
			else 			left = mouse_x + padding;
		}

		if(top < 0) top = 0;
		if(left < 0) left = 0;

		if(top + final_height > window_height) {
			top = null;
			bottom = 0;
		}

		max_width = final_width;
		max_height = final_height;


		//from here on out this assumes we've squared away all key variables.

		//max-widths ...
		$(hvr.container).css('max-width', max_width + "px");
		$(hvr.container).css('max-height', max_height + "px");
		if($(hvr.img).css('display') !== 'none') {
			$(hvr.img).css('max-width', max_width + "px");
			$(hvr.img).css('max-height', max_height + "px");
			$(hvr.img).find("img").css('max-width', max_width + "px");
			$(hvr.img).find("img").css('max-height', max_height + "px");
		}

		$(hvr.container).css('left', left);
		$(hvr.container).css('top', top);
		$(hvr.container).css('right', right);
		$(hvr.container).css('bottom', bottom);
	};

	//TIMER MANAGEMENT
	var cancelAllTimers = function() {
		cancelHideTimer();
		cancelShowTimer();
		cancelAlbumTimer();
	}

	var cancelHideTimer = function() {
	    if (hvr.hideTimer) {
	      clearTimeout(hvr.hideTimer);
	  	}
  	};

  	var cancelShowTimer = function() {
  		if(hvr.showTimer) {
  			clearTimeout(hvr.showTimer);
  		}
  	};

  	var cancelAlbumTimer = function() {
  		if(hvr.albumTimer) {
  			clearTimeout(hvr.albumTimer);
  		}
  	}
  	//END TIMER MANAGEMENT

  	hvr.onMouseOver = function(event) {
  		cancelAllTimers();
		hvr.showTimer = setTimeout(function(){
			hvr.processMedia(event.target)
		}, hvr.Options.delay);
  	}

	hvr.onMouseOut = function(event) {
		cancelAllTimers();
		hvr.hideTimer = setTimeout(function() {
			hvr.hide();
		}, hvr.Options.delay)
	};

	hvr.processMedia = function(target) {
		var media = {};
		media.type = mediaTypes.invalid;

		target = resolveTarget(target);

		var tag = $(target).prop("tagName");

		switch(tag) {
			case "A":
				media = hvr.processLink(target);
				break;
			case "IMG":
				media = hvr.processImage(target);
				break;
		}

		if(media.type && media.type != mediaTypes.invalid) {
			hvr.show(media);
		} else {
			hvr.hide();
		}
	};

	hvr.processImage = function (target) {
		var media = {};

		var sizeCheck = new Image();
		$(sizeCheck).attr('src', target.src);

		if(sizeCheck.height > $(target).height() || sizeCheck.width > $(target).width()) {
			media.type = mediaTypes.image;
			media.src = target.src;
		} else {
			media.type = mediaTypes.invalid;
		}

		return media;
	}

	hvr.processLink = function (target) {
		var media = {};

		if(target.href) {
			media.type = mediaTypes.image;
			
			var href = target.href;
			var host = getHost(href);
			var siteModule = siteModules[host];

			if(isShortenedUrl(host)) {
				href = followShortenedLink(target);
			}

			if(isImageLink(href, siteModule)) {
				media.src = href;
				return media;
			}
			else {
				if(siteModule) return siteModule.process(target);
			}
		}

		//eject!
		media.type = mediaTypes.invalid;
		media.src = '';

		return media;
	};

	var getLocation = function(url) {
		var l = document.createElement("a");
	    l.href = url;
	    return l;
	}

	var getHost = function(url) {
		var host = getLocation(url).hostname;
		var pieces = host.split('.');
		
		if(pieces.length > 2) {
			host = pieces[pieces.length - 2] + "." + pieces[pieces.length - 1];
		}
		return host;
	}

	var resolveTarget = function(target) {
		var newTarget = target;

		var tag = $(target).prop("tagName");
		if(!(tag in hvr.ValidTags)) {
			var parent = $(target).parent();

			if(parent.prop("tagName") === "A") {
				newTarget = parent[0];
			}
			else {
				while(parent.lenght > 0 && parent.prop("tagName") != "BODY") {
					parent = parent.parent();
					if(parent.prop("tagName") === "A") {
						newTarget = parent[0];
						break;
					}
				} 
			}
		}

		return newTarget;
	}

	var isShortenedUrl = function(host) {
		return (/(t\.co$|goo\.gl$|bit\.ly$|tiny\.cc$)/ig).test(host);
	};

	var followShortenedLink = function(target) {
		if($(target).attr('data-expanded-url') != null) {
			return $(target).attr('data-expanded-url');
		}

		var url = target.href;
		var response = fetchResponse(target.href);

		if(isRedirect(response)) {
			url = extractRedirectUrl(response);
		}

		return url;
	}

	var isImageLink = function(url, siteModule) {
		var isException = false;
		if(siteModule && siteModule.imgLinkException) {
			isException = siteModule.imgLinkException(url)
		}

		if(isException) {
			return false;
		} else {
			return (/\.(gif|jpg|jpeg|png|apng|tiff)/ig).test(url);
		}
	}

	var fetchResponse = function(url) {
		var result = $.ajax({ url: url, async: false });
		return result.responseText;
	}

	function isRedirect(response) {
		return (/\<noscript\>\<META http-equiv\=\"refresh\"/ig).test(response);
	}

	function extractRedirectUrl(response) {
		var expr = /URL=([^"]+)/ig;
		return response.match(expr)[0].replace("URL=", "");
	}

	function getHtml(url) {
		var response = fetchResponse(url);
		while(isRedirect(response)) {
			url = extractRedirectUrl(response);
			response = fetchResponse(url);
		}

		return response;
	}

	function parseJsonResult(response) {
		return JSON.parse(response);
	}

	var siteModules = {
		"imgur.com" : {
			process : function(target) {
				var APIKey = 'fe266bc9466fe69aa1cf0904e7298eda'; //actually RES's key. 
				var apiPrefix ='http://api.imgur.com/2/';
				var hashRe = /^https?:\/\/(?:i\.|m\.|edge\.|www\.)*imgur\.com\/(?!gallery)(?!removalrequest)(?!random)(?!memegen)([A-Za-z0-9]{5}|[A-Za-z0-9]{7})[sbtmlh]?(\.(?:jpe?g|gif|png))?(\?.*)?$/i;
				var albumHashRe = /^https?:\/\/(?:i\.|m\.)?imgur\.com\/(?:a|gallery)\/([\w]+)(\..+)?(?:\/)?(?:#\w*)?$/i;

				var media = {};
				media.type = mediaTypes.image;

				var href = target.href;

				var groups = hashRe.exec(href);
				if(!groups) {
					media.type = mediaTypes.album;

					var albumGroups = albumHashRe.exec(href);
					
					var apiURL = apiPrefix + 'album/' + albumGroups[1] + '.json';

					var raw_result = $.ajax({ url : apiURL, dataType: "json", async: false });

					var data = parseJsonResult(raw_result.responseText);
					media.images = [];

					for(var i = 0; i < data.album.images.length; i++) {
						var imgData = data.album.images[i];
						var src = imgData.links.original;
						media.images.push(src);
					}
				} else {
					//normal imgur link (non album)
				}

				return media;
			}
		},
		"tumblr.com" : {
			process : function(target) {
				var media = {};
				media.type = mediaTypes.image;
				var results = getHtml(target.href);
				var page = $(results);

				var photoDiv = page.find(".photo-wrap img");
				media.src = photoDiv.attr("src");

				return media;
			}
		}, 
		"instagram.com" : {
			process : function(target) {
				var media = {};
				media.type = mediaTypes.image;
				var results = getHtml(target.href);
				var page = $(results);
				
				var photoDiv = page.find(".LikeableFrame.iMedia > div").attr('src');

				if(photoDiv) {
					media.src = photoDiv.attr("src");
				} else {
					var imgUrlExpr = /\"display_src\":\"([^"]+)\"/ig;
					var imgUrlResult = results.match(imgUrlExpr)[0];
					media.src = imgUrlResult
						.replace('"display_src":', "")
						.replace('"', '')
						.replace('"', '');
				}

				return media;
			}
		},
		"flickr.com" : {
			process : function(target) {
				var media = {};
				media.type = mediaTypes.image;

				var metaUrl = "http://www.flickr.com/services/oembed/?format=json&url=" + encodeURIComponent(target.href);
				var response = $.ajax({ url : metaUrl, async: false});
				var metadata = parseJsonResult(response.responseText);

				media.src = metadata.url;
				return media;
			}
		},
		"facebook.com" : {
			process : function(target) {
				var media = {};
				media.type = mediaTypes.invalid;
				var photoLinkExpr = /facebook\.com\/photo.php\?/ig;

				if(photoLinkExpr.test(target.href) && $(target).attr('ajaxify')) {
					media.type = mediaTypes.image;
					var ajaxLink = $(target).attr('ajaxify');
					var srcExpr = /src=([^\&]+)/ig;
					var urlMatches = ajaxLink.match(srcExpr)[0];
					media.src = decodeURIComponent(urlMatches.replace("src=", ""));
				}

				return media;
			}
		},
		"steampowered.com" : {
			process : function(target) {
				var media = {};

				var cloudExpr = /^cloud(?:-\d)?.steampowered.com$/i;
				if(cloudExpr.test(target.href)) {
					media.type = mediaTypes.image;
					media.src = target.href;
				} else {
					media.type = mediaTypes.invalid;
				}

				return media;
			}
		}, 
		"wikipedia.org" : {
			imgLinkException : function(url) {
				return (/file:/ig).test(url);
			},
			process : function(target) {
				var media = {};

				var fileExpr = /file:/ig;

				var href = target.href;

				if(fileExpr.test(href)) {
					var results = getHtml(href);
					var page = $(results);

					var imgDiv = page.find("div.fullImageLink");
					var imgLink = imgDiv.find("a")[0];

					media.type = mediaTypes.image;
					media.src = $(imgLink).attr("href");
				}
				else {
					media.type = mediaTypes.image;
					media.src = target.href;
				}
				return media;
			}
		}
	};

	$(hvr.media).append(hvr.loader);
	$(hvr.media).append(hvr.img);
	$(hvr.container).append(hvr.media)

	$(window).on('mousemove', 'body', function(e) {
		e = e || window.event;
	    var cursor = {
	      x: 0,
	      y: 0
	    };
	    if (e.pageX || e.pageY) {
	      cursor.x = e.pageX;
	      cursor.y = e.pageY;
	    } else {
	      cursor.x = e.clientX +
	        (document.documentElement.scrollLeft ||
	        document.body.scrollLeft) -
	        document.documentElement.clientLeft;
	      cursor.y = e.clientY +
	        (document.documentElement.scrollTop ||
	        document.body.scrollTop) -
	        document.documentElement.clientTop;
	    }
	    hvr.Mouse = {
	      x: cursor.x,
	      y: cursor.y
	    };
	});

	$(document.body).append(hvr.container);

	$(hvr.container)
      .mouseleave(hvr.onMouseOut)
      .mouseover(cancelHideTimer);

	$(document.body)
		.on('mouseover', 	'a, img', {}, hvr.onMouseOver)
		.on('mouseout', 	'a, img', {}, hvr.onMouseOut);

	return hvr;
})();