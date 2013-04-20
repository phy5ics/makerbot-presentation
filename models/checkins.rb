require 'mongoid'

class Checkins
	include Mongoid::Document
	include Mongoid::Timestamps

	field :venueId, type: String
	field :location, type: Array
	field :checkins, type: Integer

	index({location: '2d'}, {min: -200, max: 200})

end