import * as pulumi from "@pulumi/pulumi";
import * as vsphere from "@pulumi/vsphere"

const deploy_spec = [
    {
        datacenter: "Demo",
        category: [
            {
                cluster: "Deployment",
                tags: ["souther", "linux"], // [Project, Group]
                datastore: "Deployment-ds-node02",
                template: "template-Rocky8",
                network: "VM Network",
                domain: "home.local",
                gateway: "192.168.0.1",
                ipv4netmask: 24,
                dns: ["192.168.0.1"],
                virtualmachine: [
                    { name: "node10", ip: "192.168.0.150", cpus: 10, memory: 32768, disk: 150, thin: true },
                    { name: "node11", ip: "192.168.0.151", cpus: 10, memory: 32768, disk: 150, thin: true },
                    { name: "node12", ip: "192.168.0.152", cpus: 10, memory: 32768, disk: 150, thin: true },
                    { name: "node13", ip: "192.168.0.153", cpus: 10, memory: 32768, disk: 150, thin: true },
                    { name: "node14", ip: "192.168.0.154", cpus: 10, memory: 32768, disk: 150, thin: true },
                    { name: "node15", ip: "192.168.0.155", cpus: 10, memory: 32768, disk: 150, thin: true },
                    { name: "node16", ip: "192.168.0.156", cpus: 10, memory: 32768, disk: 150, thin: true },
                    { name: "node17", ip: "192.168.0.157", cpus: 10, memory: 32768, disk: 150, thin: true }
                ]
            },
        ]
    }
]

for (var i in deploy_spec) {
    // Discover the ID of a vSphere datacenter object.
    let datacenter = pulumi.output(vsphere.getDatacenter({
        name: deploy_spec[i].datacenter
    }));
    for (var category_index in deploy_spec[i].category) {
        // Discover the ID of a cluster in vSphere.
        let cluster = datacenter.apply(datacenter => vsphere.getComputeCluster({
            name: deploy_spec[i].category[category_index].cluster,
            datacenterId: datacenter.id
        }));
        // Discover the UUID of an existing template.
        const template = datacenter.apply(datacenter => vsphere.getVirtualMachine({
            name: deploy_spec[i].category[category_index].template,
            datacenterId: datacenter.id
        }));
        // Discover the ID of a vSphere datastore object.
        let datastore = datacenter.apply(datacenter => vsphere.getDatastore({
            name: deploy_spec[i].category[category_index].datastore,
            datacenterId: datacenter.id
        }));
        // Discover the ID of a network in vSphere.
        let network = datacenter.apply(datacenter => vsphere.getNetwork({
            name: deploy_spec[i].category[category_index].network,
            datacenterId: datacenter.id
        }));
        // Create resource pools on vSphere clusters.
        let resourcepool = new vsphere.ResourcePool(deploy_spec[i].datacenter + "-" + deploy_spec[i].category[category_index].cluster + "-" + deploy_spec[i].category[category_index].tags[0] + "-" + deploy_spec[i].category[category_index].tags[1], {
            parentResourcePoolId: cluster.apply(cluster => cluster.resourcePoolId),
            name: deploy_spec[i].category[category_index].tags[0] + "-" + deploy_spec[i].category[category_index].tags[1]
        });
        // Create a Folder Resource.
        let folderproject = new vsphere.Folder("project-folder-" + deploy_spec[i].category[category_index].tags[0] + "-" + deploy_spec[i].category[category_index].tags[1], {
            datacenterId: pulumi.output(vsphere.getDatacenter({ name: deploy_spec[i].datacenter })).id,
            path: deploy_spec[i].category[category_index].tags[0],
            type: "vm"
        });
        let foldergroup = new vsphere.Folder("group-folder-" + deploy_spec[i].category[category_index].tags[0] + "-" + deploy_spec[i].category[category_index].tags[1], {
            datacenterId: pulumi.output(vsphere.getDatacenter({ name: deploy_spec[i].datacenter })).id,
            path: deploy_spec[i].category[category_index].tags[0] + "/" + deploy_spec[i].category[category_index].tags[1],
            type: "vm"
        }, { dependsOn: [folderproject] });
        // Create a TagCategory Resource.
        let tagcategory = new vsphere.TagCategory(deploy_spec[i].category[category_index].tags[0] + "-" + deploy_spec[i].category[category_index].tags[1], {
            name: deploy_spec[i].category[category_index].tags[0] + "-" + deploy_spec[i].category[category_index].tags[1],
            associableTypes: ["VirtualMachine"],
            cardinality: "MULTIPLE"
        });
        // Create a Tag Resource.
        let tagproject = new vsphere.Tag("project-tag-" + deploy_spec[i].category[category_index].tags[0] + "-" + deploy_spec[i].category[category_index].tags[1], {
            name: "Project",
            categoryId: tagcategory.id,
            description: deploy_spec[i].category[category_index].tags[0]
        });
        let taggroup = new vsphere.Tag("group-tag-" + deploy_spec[i].category[category_index].tags[0] + "-" + deploy_spec[i].category[category_index].tags[1], {
            name: "Group",
            categoryId: tagcategory.id,
            description: deploy_spec[i].category[category_index].tags[1]
        });
        for (var vm_index in deploy_spec[i].category[category_index].virtualmachine) {
            // Create a VirtualMachine Resource.
            let virtualmachine = new vsphere.VirtualMachine(deploy_spec[i].category[category_index].virtualmachine[vm_index].name + ".node." + deploy_spec[i].category[category_index].domain, {
                name: deploy_spec[i].category[category_index].virtualmachine[vm_index].name + ".node." + deploy_spec[i].category[category_index].domain,
                resourcePoolId: resourcepool.id,
                datastoreId: datastore.id,
                folder: foldergroup.path,
                numCpus: deploy_spec[i].category[category_index].virtualmachine[vm_index].cpus,
                memory: deploy_spec[i].category[category_index].virtualmachine[vm_index].memory,
                guestId: template.guestId,
                tags: [tagproject.id, taggroup.id],
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
                        thinProvisioned: template.disks[0].thinProvisioned
                    },
                    {
                        label: "disk1",
                        unitNumber: 1,
                        size: deploy_spec[i].category[category_index].virtualmachine[vm_index].disk,
                        eagerlyScrub: template.disks[0].eagerlyScrub,
                        thinProvisioned: deploy_spec[i].category[category_index].virtualmachine[vm_index].thin
                    }
                ],
                clone: {
                    templateUuid: template.id,
                    customize: {
                        dnsServerLists: deploy_spec[i].category[category_index].dns,
                        ipv4Gateway: deploy_spec[i].category[category_index].gateway,
                        linuxOptions: {
                            domain: "node." + deploy_spec[i].category[category_index].domain,
                            hostName: deploy_spec[i].category[category_index].virtualmachine[vm_index].name
                        },
                        networkInterfaces: [
                            {
                                dnsDomain: deploy_spec[i].category[category_index].domain,
                                dnsServerLists: deploy_spec[i].category[category_index].dns,
                                ipv4Address: deploy_spec[i].category[category_index].virtualmachine[vm_index].ip,
                                ipv4Netmask: deploy_spec[i].category[category_index].ipv4netmask
                            }
                        ]
                    }
                }
            })
        }
    }
}