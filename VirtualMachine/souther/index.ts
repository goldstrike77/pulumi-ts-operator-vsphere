import * as pulumi from "@pulumi/pulumi";
import * as vsphere from "@pulumi/vsphere"

const deploy_spec = [
    {
        datacenter: "Home",
        folder: [
            {
                cluster: "Cluster",
                name: "souther",
                type: "vm",
                tags: {},
                datastore: "ds_node02",
                template: "template_CentOS7",
                network: "VMNetwork",
                domain: "souther.lab",
                gateway: "192.168.0.1",
                ipv4netmask: 24,
                dns: ["192.168.0.1"],
                virtualmachine: [
                    { name: "node06", ip: "192.168.0.126", cpus: 10, memory: 32768, disk: 300 },
                    { name: "node07", ip: "192.168.0.127", cpus: 10, memory: 32768, disk: 300 },
                    { name: "node08", ip: "192.168.0.128", cpus: 10, memory: 32768, disk: 300 },
                    { name: "node09", ip: "192.168.0.129", cpus: 10, memory: 32768, disk: 300 }
                ]
            }
        ]
    }
]

for (var i in deploy_spec) {
    // Discover the ID of a vSphere datacenter object.
    let datacenter = pulumi.output(vsphere.getDatacenter({
        name: deploy_spec[i].datacenter
    }));
    for (var folder_index in deploy_spec[i].folder) {
        // Discover the ID of a cluster in vSphere.
        let cluster = datacenter.apply(datacenter => vsphere.getComputeCluster({
            name: deploy_spec[i].folder[folder_index].cluster,
            datacenterId: datacenter.id
        }));
        // Discover the UUID of an existing template.
        const template = datacenter.apply(datacenter => vsphere.getVirtualMachine({
            name: deploy_spec[i].folder[folder_index].template,
            datacenterId: datacenter.id
        }));
        // Discover the ID of a vSphere datastore object.
        let datastore = datacenter.apply(datacenter => vsphere.getDatastore({
            name: deploy_spec[i].folder[folder_index].datastore,
            datacenterId: datacenter.id
        }));
        // Discover the ID of a network in vSphere.
        let network = datacenter.apply(datacenter => vsphere.getNetwork({
            name: deploy_spec[i].folder[folder_index].network,
            datacenterId: datacenter.id
        }));
        // Create resource pools on vSphere clusters.
        let resourcepool = new vsphere.ResourcePool(deploy_spec[i].datacenter + "-" + deploy_spec[i].folder[folder_index].cluster + "-" + deploy_spec[i].folder[folder_index].name, {
            parentResourcePoolId: cluster.apply(cluster => cluster.resourcePoolId),
        });
        // Create a Folder Resource.
        let folder = new vsphere.Folder(deploy_spec[i].folder[folder_index].name, {
            datacenterId: pulumi.output(vsphere.getDatacenter({ name: deploy_spec[i].datacenter })).id,
            path: deploy_spec[i].folder[folder_index].name,
            type: deploy_spec[i].folder[folder_index].type
        });
        // Create a VirtualMachine Resource.
        for (var vm_index in deploy_spec[i].folder[folder_index].virtualmachine) {
            let virtualmachine = new vsphere.VirtualMachine(deploy_spec[i].folder[folder_index].virtualmachine[vm_index].name + "." + deploy_spec[i].folder[folder_index].domain, {
                name: deploy_spec[i].folder[folder_index].virtualmachine[vm_index].name + "." + deploy_spec[i].folder[folder_index].domain,
                resourcePoolId: resourcepool.id,
                datastoreId: datastore.id,
                folder: folder.path,
                numCpus: deploy_spec[i].folder[folder_index].virtualmachine[vm_index].cpus,
                memory: deploy_spec[i].folder[folder_index].virtualmachine[vm_index].memory,
                guestId: template.guestId,
                networkInterfaces: [
                    {
                        networkId: network.id,
                        adapterType: template.networkInterfaceTypes[0]
                    }
                ],
                disks: [
                    {
                        label: "disk0",
                        unitNumber: 0,
                        size: template.disks[0].size,
                        eagerlyScrub: template.disks[0].eagerlyScrub,
                        thinProvisioned: template.disks[0].thinProvisioned,
                    },
                    {
                        label: "disk1",
                        unitNumber: 1,
                        size: deploy_spec[i].folder[folder_index].virtualmachine[vm_index].disk,
                        eagerlyScrub: template.disks[0].eagerlyScrub,
                        thinProvisioned: template.disks[0].thinProvisioned,
                    }
                ],
                clone: {
                    templateUuid: template.id,
                    customize: {
                        dnsServerLists: deploy_spec[i].folder[folder_index].dns,
                        ipv4Gateway: deploy_spec[i].folder[folder_index].gateway,
                        linuxOptions: {
                            domain: deploy_spec[i].folder[folder_index].domain,
                            hostName: deploy_spec[i].folder[folder_index].virtualmachine[vm_index].name
                        },
                        networkInterfaces: [
                            {
                                dnsDomain: deploy_spec[i].folder[folder_index].domain,
                                dnsServerLists: deploy_spec[i].folder[folder_index].dns,
                                ipv4Address: deploy_spec[i].folder[folder_index].virtualmachine[vm_index].ip,
                                ipv4Netmask: deploy_spec[i].folder[folder_index].ipv4netmask
                            }
                        ]
                    }
                }
            })
        }
    }
}