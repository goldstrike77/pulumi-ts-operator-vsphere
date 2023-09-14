import * as pulumi from "@pulumi/pulumi";
import * as vsphere from "@pulumi/vsphere"

let config = new pulumi.Config();

const deploy_spec = [
    {
        license: [
            {
                name: "Standard",
                value: "104HH-D4343-07879-MV08K-2D2H2"
            },
            {
                name: "vSAN",
                value: "HN0D8-AAJ1Q-07D00-6U924-CX224"
            }

        ]
    }
]

for (var i in deploy_spec) {
    for (var license_index in deploy_spec[i].license) {
        const license = new vsphere.License(deploy_spec[i].license[license_index].name, {
            licenseKey: deploy_spec[i].license[license_index].value
        });
    }
}