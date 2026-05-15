import { setupManifest } from '@start9labs/start-sdk'
import { long, short } from './i18n'

export const manifest = setupManifest({
  id: 'owntracks',
  title: 'OwnTracks',
  license: 'MIT',
  packageRepo: 'https://github.com/stupleb/owntracks-startos',
  upstreamRepo: 'https://github.com/owntracks',
  marketingUrl: 'https://owntracks.org/',
  donationUrl: 'https://owntracks.org/booklet/',
  description: { short, long },
  volumes: ['main'],
  images: {
    mosquitto: {
      source: { dockerTag: 'eclipse-mosquitto:2.0.22' },
      arch: ['x86_64', 'aarch64'],
    },
    recorder: {
      source: { dockerTag: 'owntracks/recorder:1.0.1-43' },
      arch: ['x86_64', 'aarch64'],
    },
    frontend: {
      source: { dockerTag: 'owntracks/frontend:2.15.3' },
      arch: ['x86_64', 'aarch64'],
    },
  },
  alerts: {
    install: null,
    update: null,
    uninstall: null,
    restore: null,
    start: null,
    stop: null,
  },
  dependencies: {},
})
