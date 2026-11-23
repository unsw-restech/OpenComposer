# frozen_string_literal: true

# Fails when CI's Ruby, or any gem misc/Gemfile.lock locks, differs from
# Katana OnDemand's in ondemand.txt, by version or platform: a lock alone
# let CI build sqlite3 precompiled where OnDemand compiles it (run
# 45107464826). CI runs it under `bundle exec`, so the gems are the lock's.
# The PUN's other gems, OnDemand's newer erb and Ruby's default gems among
# them, are named but not compared: under `bundle exec` CI loads none of
# them as gems.
#
#   bundle exec ruby misc/gemcheck/compare.rb
require "bundler"
require_relative "report"

# "<name> <version> <platform>" lines, as name => "<version> <platform>".
def versions_by_name(text)
  text.lines.map(&:strip).reject { |l| l.empty? || l.start_with?("#") }
      .to_h { |l| l.split(" ", 2) }
end

ondemand_file = File.join(__dir__, "ondemand.txt")
ondemand = versions_by_name(File.read(ondemand_file))
ci = versions_by_name(Gemcheck.report)
names = ["ruby"] + Bundler.locked_gems.specs.map(&:name).uniq.sort
diffs = names.filter_map do |n|
  next if ci[n] == ondemand[n]
  "#{n}: CI #{ci[n] || 'not loaded'}, Katana OnDemand #{ondemand[n] || 'not loaded'}"
end
unchecked = ((ci.keys | ondemand.keys) - names).sort
puts "gemcheck: not compared, outside the lock: #{unchecked.join(', ')}" unless unchecked.empty?
if diffs.empty?
  puts "gemcheck: CI's Ruby and #{names.size - 1} locked gems match #{ondemand_file}"
else
  puts "gemcheck: CI differs from Katana OnDemand (#{ondemand_file}):", diffs.map { |d| "  #{d}" }
  exit 1
end
