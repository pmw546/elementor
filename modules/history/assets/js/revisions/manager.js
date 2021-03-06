import Component from './component';

var RevisionsCollection = require( './collection' ),
	RevisionsManager;

RevisionsManager = function() {
	const self = this;

	let revisions;

	const onEditorSaved = function( data ) {
		if ( data.latest_revisions ) {
			self.addRevisions( data.latest_revisions );
		}

		self.requestRevisions( () => {
			if ( data.revisions_ids ) {
				var revisionsToKeep = revisions.filter( function( revision ) {
					return -1 !== data.revisions_ids.indexOf( revision.get( 'id' ) );
				} );

				revisions.reset( revisionsToKeep );
			}
		} );
	};

	const attachEvents = function() {
		elementor.channels.editor.on( 'saved', onEditorSaved );
	};

	this.getItems = function() {
		return revisions;
	};

	this.requestRevisions = function( callback ) {
		if ( revisions ) {
			callback( revisions );

			return;
		}

		elementorCommon.ajax.addRequest( 'get_revisions', {
			success: ( data ) => {
				revisions = new RevisionsCollection( data );

				callback( revisions );
			},
		} );
	};

	this.setEditorData = function( data ) {
		var collection = elementor.getRegion( 'sections' ).currentView.collection;

		// Don't track in history.
		elementor.history.history.setActive( false );
		collection.reset( data );
		elementor.history.history.setActive( true );
	};

	this.getRevisionDataAsync = function( id, options ) {
		_.extend( options, {
			data: {
				id: id,
			},
		} );

		return elementorCommon.ajax.addRequest( 'get_revision_data', options );
	};

	this.addRevisions = function( items ) {
		this.requestRevisions( () => {
			items.forEach( function( item ) {
				var existedModel = revisions.findWhere( {
					id: item.id,
				} );

				if ( existedModel ) {
					revisions.remove( existedModel, { silent: true } );
				}

				revisions.add( item, { silent: true } );
			} );

			revisions.trigger( 'update' );
		} );
	};

	this.init = function() {
		attachEvents();

		$e.components.register( new Component( { manager: self } ) );
	};
};

module.exports = new RevisionsManager();
