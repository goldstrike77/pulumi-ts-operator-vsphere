import * as pulumi from "@pulumi/pulumi";
import * as vsphere from "@pulumi/vsphere"

const deploy_spec = [
    {
        datacenter: "Home",
        cluster: [
            {
                name: "Cluster",
                drsEnabled: false,
                haEnabled: false,
                host: [
                    { name: "node01.esxi.lab", user: "root", password: "2ZaD8UP3V^u9" },
                    { name: "node02.esxi.lab", user: "root", password: "2ZaD8UP3V^u9" }
                ]
            },
        ]
    }
]

for (var i in deploy_spec) {
    // Create a vSphere datacenter Resource.
    let datacenter = new vsphere.Datacenter(deploy_spec[i].datacenter, {
        name: deploy_spec[i].datacenter
    });
    for (var cluster_index in deploy_spec[i].cluster) {
        let computecluster = new vsphere.ComputeCluster(deploy_spec[i].cluster[cluster_index].name, {
            name: deploy_spec[i].cluster[cluster_index].name,
            datacenterId: datacenter.moid,
            drsEnabled: deploy_spec[i].cluster[cluster_index].drsEnabled,
            haEnabled: deploy_spec[i].cluster[cluster_index].haEnabled
        }, { dependsOn: [datacenter] });
        for (var host_index in deploy_spec[i].cluster[cluster_index].host) {
            let host = new vsphere.Host(deploy_spec[i].cluster[cluster_index].host[host_index].name, {
                hostname: deploy_spec[i].cluster[cluster_index].host[host_index].name,
                username: deploy_spec[i].cluster[cluster_index].host[host_index].user,
                password: deploy_spec[i].cluster[cluster_index].host[host_index].password,
                thumbprint: pulumi.output(vsphere.getHostThumbprint({ address: deploy_spec[i].cluster[cluster_index].host[host_index].name, insecure: true })).id,
                cluster: computecluster.id
            });
        }
    }
}