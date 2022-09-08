
import Syncable from './syncable';

export default class Image extends Syncable {
    constructor(client, fingerprint = null) {
        super(client, fingerprint);
    }

    // Overwrite name method since images use fingerprint
    name() {
        return this.config.fingerprint;
    }

    aliases() {
        return this.config.aliases
    }

    set_default_config(fingerprint = null) {
        this.config = {
            fingerprint: fingerprint,
            profiles: [ 'default' ], // Note: profiles can only be set AFTER image is created (https://discuss.linuxcontainers.org/t/container-config-sticky-with-image/5782)
            public: false,
            source: {},
        };
        return this.set_synced(false);
    }

    url() {
        return `/images/${this.name()}`;
    }

    /**
     * Publish image from container
     */
    from_container(container) {
        this.config.source = {
            name: container.name(),
            type: 'container',
        };

        return this;
    }

    // @TODO this only works on initial create
    // to make this work on update it would be better to give aliases it's own interface
    set_aliases(aliases) {
        this.config.aliases = aliases;
        return this;
    }

    async create() {
        try {
            let res = await this.client.async_operation().post('/images', this.config)

            // The fingerprint in the initial response lives in `metadata` whereas eventually it will be in the image object
            // Set it here for load method to work
            this.config.fingerprint = res.metadata.fingerprint;
        } catch(err) {
            throw err;
        }

        return this.load();
    }

    async update() {
        let response = await this.client.operation().put(this.url(), this.config);
        return this.load();
    }

    async destroy() {
        await this.client.async_operation().delete(this.url());
        await this.unload();

        return this;
    }

}
