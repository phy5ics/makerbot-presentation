Makerbot Store Presentation
---------------------------
This is my presentation for the Makerbot Store on April 24. It combines Foursquare check-in data from the past year with Three.js and a custom library to save that output to an STL file. The STL file can then be printed on the Makerbot.

To run, it's simple (once MongoDB is running for geospatial indexing):
rerun --pattern '{Gemfile,Gemfile.lock,*.rb}' foreman start

To index locations in MongoDB run this rake task:
foreman run rake db:create_indexes[development]