require 'cucumber/rake/task'
Cucumber::Rake::Task.new(:features) do |t|
  t.cucumber_opts = "--format progress"
end

require 'rspec/core/rake_task'
RSpec::Core::RakeTask.new(:spec)

task :test => :spec

require_relative './models/venue'

namespace :db do
    task :create_indexes, :environment do |t, args|
        unless args[:environment]
            puts "Must provide an environment"
            exit
        end

        Mongoid.configure do |config|
					Mongoid.load!('config/mongoid.yml')
				end

        Venue.create_indexes
    end
end