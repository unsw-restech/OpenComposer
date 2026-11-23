# frozen_string_literal: true

# The Ruby and gems OpenComposer loads, one "<name> <version> <platform>"
# line per gem after a "ruby <version> <platform>" line. Katana OnDemand's
# PUN (config.ru) and CI (compare.rb) both print it, and compare.rb holds
# CI to the PUN's copy, ondemand.txt (unsw-restech/iris#176's retro).
module Gemcheck
  # What run.rb requires, and the gems the tests serve the app with.
  LIBS = %w[sinatra sinatra/reloader sqlite3 rackup webrick].freeze

  def self.report
    LIBS.each { |lib| require lib }
    # Requiring sinatra starts its server at exit unless told not to.
    Sinatra::Application.set :run, false
    lines = ["ruby #{RUBY_VERSION} #{RUBY_PLATFORM}"]
    Gem.loaded_specs.values.sort_by(&:name).each do |s|
      lines << "#{s.name} #{s.version} #{s.platform}"
    end
    lines.join("\n") + "\n"
  end
end
