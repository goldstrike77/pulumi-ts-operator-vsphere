import * as pulumi from "@pulumi/pulumi";
import * as vsphere from "@pulumi/vsphere"

let config = new pulumi.Config();

const license = new vsphere.License("license", {
    licenseKey: config.require("licenseKey")
});