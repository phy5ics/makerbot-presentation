BASE_APP
---------
This is a stub application for Sinatra that is pre-configured for the following goodness:
* Unicorn
* Foreman
* Rerun
* Guard
* Mongoid
* Rspec
* Cucumber
* Capybara
* Capybara Webkit
* HAML, SASS, Compass

It also includes some Simplecov and Factory Girl to help out with testing.  To use, do a global search for "Base" and replace with your app name.

Note that since this uses Capybara Webkit, you will need the Qt libraries installed.

rerun --pattern '{Gemfile,Gemfile.lock,*.rb}' foreman start