# Cloudless Scheduler

## Introduction

Like all serverless functions, Fluence Cloudless Functions are event-based. That is, something needs to happen in order to trigger the function. An event trigger can originate in a multitude of contexts, such as a browser click or data change in a spreadsheet. The Fluence Cloudless Scheduler implements an API for . In addition to event-based triggers, the Cloudless Scheduler can also accommodate time-based triggers, similar to cronjobs, such as time elapsed, specific dates or interval.

The Cloudless Scheduler is implemented by means of *spells*: stateful, event-driven Aqua scripts with dedicated kv storage per spell and a trigger configuration defining events. The remainder of this chapter introduces the *spells* so you can Implement Cloudless Scheduler functionality, if needed by your Cloudless App.


Tested on:

- the FCLI version: `@fluencelabs/cli/0.13.5 linux-x64 node-v18.19.0`
- Network env: `local`

**TODO: when all updates are published, update to `kras` and the latest FCLI**

## Create your first Spell: step-by-step

First let's take a look at how to create a simple spell from the Fluence CLI template.

1. Initialize a project with `fluence init -t minimal` 
    
    The spell library dependency should be added to the `fluence.yaml` configuration file automatically:
    
    ```yaml
    # FCLI version: 0.13.5
    #...
    
    aquaDependencies:
      "@fluencelabs/aqua-lib": 0.9.1
      "@fluencelabs/spell": 0.6.9
    ```
    
2. Initialize a new spell template with `fluence spell new myFirstSpell`.
    
    This command modifies the `fluence.yaml` file, adding the spell to the list of the project’s spells and the default deal we deploy later.
    
    ```yaml
    # FCLI version: 0.13.5 
    deals:
      dealName:
        targetWorkers: 1
        pricePerWorkerEpoch: 0.1
        collateralPerWorker: 1
        services: []
        spells: [ myFirstSpell ]  # <-- added the spell to the deal
    
    spells:
      myFirstSpell:   # <-- added the new spell to the list of project's spells 
        get: src/spells/myFirstSpell # <-- the path to the spell directory 
    ```
    
    This command will create a directory for the spell and its configuration in the `src/spells` directory:
    
    ```bash
    $ tree src/spells
    src/spells
    └── myFirstSpell
        ├── spell.aqua
        └── spell.yaml
    ```
    
    The path to the spell directory is also set in the `fluence.yaml` file and can be manually modified if needed.
    
3. The spell script is located in the `spell.aqua` file:
    
    ```aqua
    -- the Fluence CLI version is 0.13.5
    
    aqua MyFirstSpell
    
    -- Note: spell main function must be exported
    export spell
    
    import Spell from "@fluencelabs/spell/spell_service.aqua" -- (1)
    
    func spell(): -- (2)
        Spell "myFirstSpell" -- (3)
        Spell.store_log("Spell 'myFirstSpell' is working!") -- (4)
    ```
    
    Let’s review the most important parts of the file:  
    
    1. Importing the (Spell Service API)[#how-to-resolve-your-spell-service] is required to use logging capabilities, private spell storage, etc. Note that you can implement spells without ever interacting with the Spell Service if you don’t need the features it provides.
    2. The `spell` function here is an entry point to the spell’s execution. The main function has several features we explore in the [later](#inital-arguments) sections.
        
        You can modify the name of the main function to any valid name, but you also need to modify the name in the `spell.yaml` configuration file.
        
    3. To write logs in the [Spell Log Storage](#spell-logs-api), you need to resolve [link to the services resolution in aqua] the Spell Service that belongs to the executing spell using the Spell’s Name.
        
        Note that you have several options to resolve the correct spell service, which we’ll explore [later](#how-to-resolve-your-spell-service).
        
    4. Here, we call the function provided by the Spell Service to store the message in the logs. This message will be added to the logs each spell runs. 
4. The spell configuration is located in the `spell.yaml` file and defines several important aspects of the spell execution. Let’s look at the content of the default spell configuration file:
    
    ```yaml
    # FCLI: 0.13.5
    version: 0
    
    aquaFilePath: ./spell.aqua # <-- (1)
    
    function: spell # <-- (2)
    
    clock: # <-- (3)
      periodSec: 60
      endDelaySec: 1800
    ```
    
    1. `aquaFilePath` must be set to the aqua file with the main spell function; the path is relative to the `spell.yaml` path, so `./spell.aqua` works since it’s in the same directory.
    2. `function` must be set to the main spell function, by default, `spell` we have seen when we look into the `spell.aqua` file. You choose any valid name you want.
    3. `clock` defines the configuration of when and how your spell is run.
        1. `periodSec` defines how *often* your spell is run. `periodSec: 60` means that the spell is run every minute. 
        2. `endDelaySec`defines when the spell must be stopped from execution. `endDelaySec: 1800` means that the spell will no longer be periodically executed in 30 minutes.
            
            **Warning:** this delay is evaluated on the client, so the 30 minutes are counted since you created your deal, not since the spell was installed on a peer. ::
            
        
        You can use other settings to tune your spells, which will be explored [later](#spell-configuration-in-fluence-cli).
        
5. To deploy the deal, call `fluence deal deploy` . If you haven’t deployed before or need more info, see [link].
6. You can check the logs of your spell with `fluence deal logs dealName myFirstSpell`:
    
    Example output:
    
    ```bash
    $ fluence deal logs dealName myFirstSpell                                                                                                                                                                                                                1 ↵
    Connecting to random local relay: /ip4/127.0.0.1/tcp/9993/ws/p2p/12D3KooWDd7zwsdYart7z9MQ2yEagjafPHLxbzNkNP7wYxJxvKiN
    Connected
    dealName (host_id: 12D3KooWFS4WXar3f1SWCykTUy9cVKNU8x1yDA18ZYp86mXTUyAe, worker_id: 12D3KooWRRyM8XNhCFTQaqMQpg483Bq8pdfveeMKNxx4hArrNq7u, spell_id: 275382d7-cb42-402c-ad80-85a546ecfe51):
    
    2024-02-05 15:36:22 Spell 'myFirstSpell' is working!
    ```
    
    You can also check how the process of installing your spell is happening by checking the `worker-spell` logs with `fluence deal logs`
    
    Example output:
    
    ```bash
    $ fluence deal logs
    Connecting to random local relay: /ip4/127.0.0.1/tcp/9993/ws/p2p/12D3KooWDd7zwsdYart7z9MQ2yEagjafPHLxbzNkNP7wYxJxvKiN
    Connected
    dealName (host_id: 12D3KooWFS4WXar3f1SWCykTUy9cVKNU8x1yDA18ZYp86mXTUyAe, worker_id: 12D3KooWRRyM8XNhCFTQaqMQpg483Bq8pdfveeMKNxx4hArrNq7u, spell_id: 4f35fd35-6be3-4a0b-8426-c0f9031d1cfa):
    
    2024-02-05 15:36:16 Installing worker for deal 0xeb92a1b5c10ad7bfdcaf23cb7dda9ea062cd07e8
    2024-02-05 15:36:16 parsed worker definition bafkreifgq24izy6wu22dt6wbrentfcjkmyunof32ospc3qzlkl4adg6tcm {
      "services": [],
      "spells": [
        {
          "config": "bafkreibk6jbl6qwrp2hktbjkzfctfsyeblffrt3pcm5kte367pes5inhpm",
          "init_args": "bafkreicecnx2gvntm6fbcrvnc336qze6st5u7qq7457igegamd3bzkx7ri",
          "name": "myFirstSpell",
          "script": "bafkreiddhrqqyxhfuyg3egfh34lkhktjplzxjmbmkm22kfjpviory7pjbi"
        }
      ]
    }
    2024-02-05 15:36:18 Deploying spell myFirstSpell
    2024-02-05 15:36:22 Installed spell myFirstSpell 275382d7-cb42-402c-ad80-85a546ecfe51
    2024-02-05 15:36:23 Installation finished
    2024-02-05 15:36:23 Worker installation finished with status {
      "message": "",
      "state": "INSTALLATION_SUCCESSFUL",
      "timestamp": 1707147383
    }
    ```
    

## Spell Configuration in Fluence CLI

### Spell Triggers Configuration

The `spell.yaml` file allows you to set up the *Spell Trigger,* aka how and on what conditions your spells will be run.

**Timer-based** **Spell Trigger** provides an opportunity to trigger spells at a certain time with a certain regularity or end execution at a certain date. 

To setup a timer-based spell trigger for your spells, you can use the following fields in your `spell.yaml` file:

- `startDelaySec` and `startTimestamp` define when to run the spell (you can use only one of them),
- `endDelaySec` and `endTimestamp` define when to stop running the spell (you can use only one of them),
- `periodSec` defines how often to run the spell.

For example, if you want to setup a spell that runs only **once**, you can use the following setup:

```yaml
clock:
  periodSec: 0
```

On the other hand, if you want your spell to run **every two minutes** **indefinitely**, you can do:

```yaml
clock:
  periodSec: 120
```

Next, if we want the spell to **start on New Year’s Eve and end in a year**, we can add the date:

```yaml
clock:
  periodSec: 120
    startTimestamp: 2024-12-31
  endTimestamp: 2025-12-31
```

You can also use `startDelaySec` and `endDelaySec` fields to setup the times more flexibly than just setting the timestamps:

```yaml
clock:
  periodSec: 120
  startDelaySec: 86400
  endDelaySec: 1209600
```

In this example, the spell will start executing in approximately a day after the spell is deployed to the Network and will end in two weeks. 

**Warning:** under the hood, the timestamps are evaluated from `startDelaySec` and `endDelaySec` on your local computer when you call `fluence deal deploy` , so when you see `startDelaySec: 60`, it means that the spell start time is the time when you initiated the deployment plus 1 minute. So, if you want to use `startDelaySec`, you must choose bigger numbers for the delay since some time will definitely be spent on deployment. 

#### Timer-based Spell Trigger Restrictions

 To create valid Timer-Based Spell Trigger Configurations, you need to consider several rules:

- the end dates set in `endDelaySec` and `endTimestamp` must be ***later*** than the start dates in `startDelaySec` and `startTimestamp`,
- the end date **cannot precede** the spell deployment date
    
    Note that *the past* check happens during the spell installation on a specific provider, and if this check fails, the provider won’t be able to install your spell, so you **must be careful** when using the end date settings. 
    
- the period used in `periodSec` must be less than 100 years
    
    That’s just some sensible upper bound to avoid strange behaviors. Please write the developers [link] if your business logic requires more.
    

### Other Important Fields

#### Spell Setup

`aquaFilePath`  — a path to the aqua file with *the spell main function*

`function`  — a name of *the spell main function*

`version`  — Fluence CLI-specific version of the spell configuration. Note that it’s **not** relevant to the spell versioning.

#### Inital Arguments

`initArgs` field describes a key-value map that will be passed to spell on installation. The map can contain strings, numbers, and complex objects. 

- Example
    
    Add this in your `spell.yaml`:
    
    ```yaml
    initArgs:
      some_value: "hello"
      num_value: 35
      object:
        name: "Joe"
        age: 35
        children:
          - "Marie"
          - "Tom"
        dogs:
          - name: "Anna"
          - name: "Petr"
    ```
    
    The spell that uses these values can be like this:
    
    ```aqua
    aqua MyFirstSpell
    
    export spell
    
    import "@fluencelabs/aqua-lib/builtin.aqua"
    import "@fluencelabs/spell/spell_service.aqua"
    
    data Dog:
        name: string
    
    data Person:
        name: string
        age: u32
        children: []string
        dogs: []Dog
    
    func spell(some_value: string, num_value: u32, object: Person):
      Spell "self"
      log_msg <- Debug.stringify(["Some value: ", some_value, "Num value:", num_value, "Object:", object])
      Spell.store_log(log_msg)
    ```
    
    - Output
        
        ```bash
        $ fluence deal logs dealName myFirstSpell
        Connecting to random local relay: /ip4/127.0.0.1/tcp/9991/ws/p2p/12D3KooWFS4WXar3f1SWCykTUy9cVKNU8x1yDA18ZYp86mXTUyAe
        Connected
        dealName (host_id: 12D3KooWFS4WXar3f1SWCykTUy9cVKNU8x1yDA18ZYp86mXTUyAe, worker_id: 12D3KooWBPfFGP7y1jiKgQ4DEkuS87KsfcPt5DDVoWUiwNtbzYFE, spell_id: e1a2df12-efcd-4a13-be4d-dfc8d1caf3b8):
        
        2024-02-09 16:56:13 Some value:  hello Num value: 35 Object: {
          "age": 35,
          "children": [
            "Marie",
            "Tom"
          ],
          "dogs": [
            {
              "name": "Anna"
            },
            {
              "name": "Petr"
            }
          ],
          "name": "Joe"
        }
        ```
        

## Spell Basics

In this section, we will describe how to use Spell Service's features.

You can find the actual Spell Service API for your version [here](https://www.npmjs.com/package/@fluencelabs/spell).

### How to resolve your Spell Service

In the template example, we saw the way to find the spell service that belongs to the spell script:

```aqua
func spell():
   Spell "myFirstSpell"
```

Here, we use the spell name or alias [link to the concept of aliases] to find the spell service. In the same way, you can find the spell from your command line using Fluence CLI. However, there are two other spell-specific ways to do so:

1. Use `spell_id` of your spell, automatically available as an argument of the main function of your spell:
    
    ```aqua
    func spell(spell_id: string):
    	Spell spell_id
    ```
    
2. Use reserved names `"spell"` or `"self"`:
    
    ```aqua
    func spell():
    	Spell "spell"
    ```
    

### Spell Key-Value Storage API

The major spell feature is *storage*: your spells can preserve their inner state between executions and make decisions based on the saved data. The data is preserved during the provider peers' reboots and is restricted to the paid amount of disk space [link, is it true?].

The storage is presented as an extended Key-Value dictionary where you can store values of several types:

- strings
    - API
        
        ```aqua
        data StringValue:
          -- The stored value, an empty string if the success isn't true or the value is absent
          value: string
          -- True if the `get` operation was successful
          success: bool
          -- Error message if the success flag is false, an empty string otherwise
          error: string
          -- True if there's not such value for the given key
          absent: bool
        
        service Spell:
          -- Load the string by the given `key` from the storage
          get_string(key: string) -> StringValue
          -- Store the `value` string by the given `key`
          set_string(key: string, value: string) -> UnitValue
        ```
        
    - Example
        
        ```aqua
        aqua MyFirstSpell
        
        export spell
        
        import "@fluencelabs/spell/spell_service.aqua"
        import "@fluencelabs/aqua-lib/builtin.aqua"
        
        func spell():
          Spell "self"
          key = "key"
          result <- Spell.get_string(key)
          if result.success:
            if result.absent:
              Spell.set_string("key", ")")
            else:
              Spell.store_log(result.value)
              new_value <- Op.concat_strings(result.value, ")")
              Spell.set_string("key", new_value)
        ```
        
        - Output
            
            ```aqua
            $ fluence deal logs dealName myFirstSpell
            Connecting to random local relay: /ip4/127.0.0.1/tcp/9992/ws/p2p/12D3KooWMNJvkaLpUKzK64CgX1x9PNdy3vLCWFgLSpB2S7ymVhEC
            Connected
            dealName (host_id: 12D3KooWFS4WXar3f1SWCykTUy9cVKNU8x1yDA18ZYp86mXTUyAe, worker_id: 12D3KooWRRyM8XNhCFTQaqMQpg483Bq8pdfveeMKNxx4hArrNq7u, spell_id: 6d8fc228-562a-4284-8d9b-f293c2f12785):
            
            2024-02-07 08:16:04 )
            2024-02-07 08:17:04 ))
            2024-02-07 08:18:04 )))
            ```
            
- `u32` numbers
    - API:
        
        ```aqua
        data U32Value:
          -- The stored value, zero if the success isn't true or the value is absent
          value: u32
          -- True if the `get` operation was successful
          success: bool
          -- Error message if the success flag is false, an empty string otherwise
          error: string
          -- True if there's not such value for the given key
          absent: bool
        
        service Spell:  
          get_u32(key: string) -> U32Value
          set_u32(key: string, value: u32) -> UnitValue
        ```
        
    - Example
        
        ```aqua
        aqua MyFirstSpell
        
        export spell
        
        import "@fluencelabs/spell/spell_service.aqua"
        import "@fluencelabs/aqua-lib/builtin.aqua"
        
        func spell():
          Spell "self"
          key = "key"
          result <- Spell.get_u32(key)
          if result.success:
            if result.absent:
              Spell.set_u32("key", 0)
            else:
              msg <- Debug.stringify(result.value)
              Spell.store_log(msg)
              new_value = result.value + 1
              Spell.set_u32("key", new_value)
        ```
        
        - Output
            
            ```aqua
            $ fluence deal logs dealName myFirstSpell
            Connecting to random local relay: /ip4/127.0.0.1/tcp/9993/ws/p2p/12D3KooWDd7zwsdYart7z9MQ2yEagjafPHLxbzNkNP7wYxJxvKiN
            Connected
            dealName (host_id: 12D3KooWFS4WXar3f1SWCykTUy9cVKNU8x1yDA18ZYp86mXTUyAe, worker_id: 12D3KooWRRyM8XNhCFTQaqMQpg483Bq8pdfveeMKNxx4hArrNq7u, spell_id: a8451478-b3b3-46f1-b45d-dae7dcf36a24):
            
            2024-02-07 08:23:06 "0"
            2024-02-07 08:24:06 "1"
            2024-02-07 08:25:06 "2"
            2024-02-07 08:26:06 "3"
            ```
            
- lists of `strings`
    - API
        
        ```aqua
        data StringListValue:
          -- List of strings stored by the given key, empty if there's no such key 
          value: []string
          success: bool
          error: string
        
        service Spell:  
          -- Load the last value of the list
          list_pop_string(key: string) -> StringValue
          -- Store the value at the end of the list
          list_push_string(key: string, value: string) -> UnitValue
          -- Load all the values of the list
          list_get_strings(key: string) -> StringListValue
          -- Remove a `value` from the `key` list
          -- Note that it must be the exact value 
          list_remove_string(key: string, value: string) -> UnitValue
        ```
        
    - Example
        
        ```aqua
        aqua MyFirstSpell
        
        export spell
        
        import "@fluencelabs/spell/spell_service.aqua"
        import "@fluencelabs/aqua-lib/builtin.aqua"
        
        func spell():
          Spell "self"
          key = "key"
          result <- Spell.list_get_strings(key)
          if result.success:
            if result.value.length < 5:
                Spell.list_push_string(key, ")")
            else:
                Spell.list_pop_string(key)
            msg <- Debug.stringify(result.value)
            Spell.store_log(msg)
        ```
        
        - Output
            
            ```aqua
            $ fluence deal logs dealName myFirstSpell
            Connecting to random local relay: /ip4/127.0.0.1/tcp/9992/ws/p2p/12D3KooWMNJvkaLpUKzK64CgX1x9PNdy3vLCWFgLSpB2S7ymVhEC
            Connected
            dealName (host_id: 12D3KooWFS4WXar3f1SWCykTUy9cVKNU8x1yDA18ZYp86mXTUyAe, worker_id: 12D3KooWRRyM8XNhCFTQaqMQpg483Bq8pdfveeMKNxx4hArrNq7u, spell_id: 1e62bbc3-d368-4030-a877-261a748bb66a):
            
            2024-02-07 08:51:45
            2024-02-07 08:52:45 )
            2024-02-07 08:53:46 ) )
            2024-02-07 08:54:46 ) ) )
            2024-02-07 08:55:46 ) ) ) )
            2024-02-07 08:56:46 ) ) ) ) )
            2024-02-07 08:57:46 ) ) ) )
            2024-02-07 08:58:46 ) ) ) ) )
            2024-02-07 08:59:46 ) ) ) )
            2024-02-07 09:00:46 ) ) ) ) )
            2024-02-07 09:01:46 ) ) ) )
            2024-02-07 09:02:46 ) ) ) ) )
            ```
            

To remove the key from the storage, you can use the `remove_key` function.

- API
    
    ```aqua
    service Spell:
      remove_key(key: string) -> UnitValue
    ```
    

To check if a key exists, you can call the `exists` function.

- API
    
    ```aqua
    service Spell:
    	  exists(key: string) -> BoolValue
    ```
    

#### Spell Storage Access Permissions

The Spell Service protects spell data from **writing** from arbitrary sources. The writing rules are the following:

- the spell can write to *any* key in its own KV
- the particles[links to what a particle is] sent from the *same* worker the target spell is install on can write to the keys with `w_`  and `hw_`  prefix
    
    For example, another spell installed on the same worker can write to the keys `w_message`  or `hw_update`.
    
- the particles on the host on which the target spell’s worker is installed can access the keys with `h_`  and `hw_`  prefix.
    
    For example, a system spell can write to the keys `h_hello_from_host`  or `hw_any_valid_name`.
    

However**, everyone can read** anything from the spell’s storage, so you must not store in the KV private information like keys. You should consider using other methods.   

### Spell Logs API

The Spell Service also provides additional storage for logs. The storage is restricted to 500 entries; older logs are deleted automatically when new ones are added.

- API
    
    ```aqua
    data Log:
      -- when the log was created
      timestamp: u64
      -- the log message
      message: string
    
    data GetLogsResult:
      logs: []Log
      success: bool
      error: string
    
    service Spell:
      -- Store a log. 
      -- Note that only a **spell** can store the log in its logs storage
      store_log(log: string) -> UnitValue
    	-- Return all logs ordered by timestamp ascending.
    	get_logs() -> GetLogsResult
    ```
    
- Example
    
    Note that the spell that just writes to its logs is the default template created by the Fluence CLI. Here’s another — though almost identical — way to write a simple spell with logging: 
    
    ```aqua
    aqua MyFirstSpell
    
    export spell
    
    import "@fluencelabs/spell/spell_service.aqua"
    
    func spell():
      Spell "self"
      Spell.store_log("I was run!")
    ```
    
    You can read the logs using the Fluence CLI command like this:
    
    ```bash
    $ fluence deal logs dealName myFirstSpell                                                                                                                                                                                                              130 ↵
    Connecting to random local relay: /ip4/127.0.0.1/tcp/9991/ws/p2p/12D3KooWFS4WXar3f1SWCykTUy9cVKNU8x1yDA18ZYp86mXTUyAe
    Connected
    dealName (host_id: 12D3KooWFS4WXar3f1SWCykTUy9cVKNU8x1yDA18ZYp86mXTUyAe, worker_id: 12D3KooWBPfFGP7y1jiKgQ4DEkuS87KsfcPt5DDVoWUiwNtbzYFE, spell_id: b030cf69-7a35-4eeb-bad1-981797e67eec):
    
    2024-02-09 15:49:15 I was run!
    ```
    
    Or you can get the logs manually via Aqua. Copy this code into your `src/aqua/main.aqua`:
    
    ```aqua
    aqua Main
    
    import "@fluencelabs/aqua-lib/builtin.aqua"
    import "@fluencelabs/aqua-lib/subnet.aqua"
    import "@fluencelabs/spell/spell_service.aqua"
    
    use "deals.aqua"
    
    export testSpell
    
    func testSpell() -> []GetLogsResult:
        deals <- Deals.get()
        dealId = deals.dealName!.dealIdOriginal
    
        logs: *GetLogsResult
        on HOST_PEER_ID:
            subnet <- Subnet.resolve(dealId)
            if subnet.success == false:
                Console.print(["Failed to resolve subnet: ", subnet.error])
    
            for w <- subnet.workers:
                on w.worker_id! via w.host_id:
                    Spell "myFirstSpell"
                    logs <<- Spell.get_logs()
        <- logs
    ```
    
    Then call it via the Fluence CLI:
    
    ```bash
    $ fluence run -f 'testSpell()' -i src/aqua/main.aqua
    Connecting to random local relay: /ip4/127.0.0.1/tcp/9991/ws/p2p/12D3KooWFS4WXar3f1SWCykTUy9cVKNU8x1yDA18ZYp86mXTUyAe
    Connected
    [
      {
        "error": "",
        "logs": [
          {
            "message": "I was run!",
            "timestamp": 1707493755
          }
        ],
        "success": true
      }
    ]
    ```
    

### Spell Mailbox API

The Spell Service provides the Mailbox API to receive messages from the outside world. Note that the mailbox keeps only 50 last messages in the storage.

- API
    
    ```aqua
    
    data MailboxMessage:
      -- How put the message into the mailbox
      init_peer_id: string
      -- When the message was put
      timestamp: u64
      -- The message
      message: string
    
    data GetMailboxResult:
      messages: []MailboxMessage
      success: bool
      error: string
    
    data PopMailboxResult:
      -- Contain the earliest message in the mailbox
      message: []MailboxMessage
      success: bool
      absent: bool
    
      error: string
    service Spell:
    	-- Push a message to the mailbox. 
      -- Mailbox keeps 50 latest messages.
      push_mailbox(message: string) -> UnitValue
    	-- Get the latest mailbox message and remove it from the mailbox.
      -- result.absent is true if there are no messages in the mailbox.
      -- Only the spell can pop the messages from the mailbox
    	pop_mailbox() -> PopMailboxResult
    	-- Get all messages from the mailbox in FIFO order.
    	get_mailbox() -> GetMailboxResult
    ```
    
- Example
    
    The Spell Script:
    
    ```aqua
    aqua MyFirstSpell
    
    export spell
    
    import "@fluencelabs/aqua-lib/builtin.aqua"
    import "@fluencelabs/spell/spell_service.aqua"
    
    func spell():
      Spell "self"
    
      mailbox_result <- Spell.pop_mailbox()
      if mailbox_result.success && !mailbox_result.absent:
        message = mailbox_result.message!
        log_msg <- Debug.stringify(["Got message:", message.message, "from:", message.init_peer_id])
        Spell.store_log(log_msg)
    ```
    
    This script will add a log each time it finds the message in the mailbox.
    
    We can put the message ourselves via Fluence CLI. Add this into your `src/aqua/main.aqua` :
    
    ```aqua
    aqua Main
    
    import "@fluencelabs/aqua-lib/builtin.aqua"
    import "@fluencelabs/aqua-lib/subnet.aqua"
    import "@fluencelabs/spell/spell_service.aqua"
    
    use "deals.aqua"
    
    export testSpell
    
    func testSpell():
        deals <- Deals.get()
        dealId = deals.dealName!.dealIdOriginal
    
        on HOST_PEER_ID:
            subnet <- Subnet.resolve(dealId)
            if subnet.success == false:
                Console.print(["Failed to resolve subnet: ", subnet.error])
    
            for w <- subnet.workers:
                on w.worker_id! via w.host_id:
                    Spell "myFirstSpell"
                    Spell.push_mailbox("hello from the client!")
    ```
    
    And call the Fluence CLI command: `fluence run -f 'testSpell()' -i src/aqua/main.aqua` 
    When the spell wakes up, it’ll see the message and notify about it in the log. We can check the log using the usual Fluence CLI command.
    
    - Output
        
        ```bash
        $ fluence deal logs dealName myFirstSpell
        Connecting to random local relay: /ip4/127.0.0.1/tcp/9992/ws/p2p/12D3KooWMNJvkaLpUKzK64CgX1x9PNdy3vLCWFgLSpB2S7ymVhEC
        Connected
        dealName (host_id: 12D3KooWFS4WXar3f1SWCykTUy9cVKNU8x1yDA18ZYp86mXTUyAe, worker_id: 12D3KooWBPfFGP7y1jiKgQ4DEkuS87KsfcPt5DDVoWUiwNtbzYFE, spell_id: 8e00fe09-b6d8-4c81-b925-e3fb82d2317c):
        
        2024-02-09 16:18:13 Got message: hello from the client! from: 12D3KooWQc1TuBEi54HNVuerVSZAMD3sDd4ZzTLan4tAgNp9SHi7
        ```
        

### Other Spell Service API Functions

If you read the full Spell Service definition, you may notice other functions not covered in the sections above. The main reason for this is that they are mostly used for utility purposes like initialization, AIR error handling, and so on, and you, as a developer, likely never need them. If you are interested, the implementation details you may find in [the Spell Service FLIP.](https://www.notion.so/Spells-Service-99e17c405f2548efb20e86866298a912?pvs=21)

## Tips and Tricks

#### Storing objects in the Spell Service Storage

Although the Spell Storage API mainly provides functions for storing strings, it’s possible to store any object using Nox JSON builtins:

```aqua
service Json("json"):
   -- Parse the given string into a JSON object
   parse(str: string) -> ⊤
   -- Create a string from the given JSON object
   stringify(obj: ⊤) -> string
```

Note that this service isn’t in the aqua-lib since it’s too generic, although the `stringify` function is available via `Debug.stringify()`.

To parse a specific object, you need to provide a service that references the `“json”` builtin and the `parse` function returning the required type:

```aqua
data MyObject:
   name: string

service MyObjectJson("json"):
  -- Note that here we return MyObject, not some generic type   
  parse(str: string) -> MyObject  
```

If you want to parse several objects, you need to provide the instance of JSON service for each of them:

```aqua
data MyObject:
   name: string

data MyAnotherObject:
	 counter: u32

service MyObjectJson("json"):
  parse(str: string) -> MyObject 

-- Note that you can use any unique name 
service MyAnotherObjectJson("json"):
  parse(str: string) -> MyAnotherObject 
```

- **Example**
    
    ```aqua
    aqua MyFirstSpell
    
    export spell
    
    import "@fluencelabs/aqua-lib/builtin.aqua"
    import "@fluencelabs/spell/spell_service.aqua"
    
    -- The object we want to store
    data Object:
        name: string
        counter: u32
    
    -- To parse the object from string, we need to provide the service
    -- that will parse 
    service ObjectJson("json"):
        parse(encoded: string) -> Object
    
    func log(msg: []string):
        Spell "self"
        str <- Debug.stringify(msg)
        Spell.store_log(str)
    
    func spell():
      Spell "self"
    
      result <- Spell.get_string("object")
      if result.success && !result.absent:
          log(["Got: ", result.value])
          try:
              object <- ObjectJson.parse(result.value)
              object2 = Object(name = object.name, counter = object.counter + 1)
              object2_str <- Debug.stringify(object2)
              Spell.set_string("object", object2_str)
          catch e:
            log(["Can't parse the object"])
      else:
        object = Object(name = "test", counter = 0)
        object_str <- Debug.stringify(object)
        log(["Created object:", object_str])
        Spell.set_string("object", object_str)
    ```
    
    - **Output**
        
        ```bash
        $ fluence deal logs dealName myFirstSpell
        Connecting to random local relay: /ip4/127.0.0.1/tcp/9993/ws/p2p/12D3KooWDd7zwsdYart7z9MQ2yEagjafPHLxbzNkNP7wYxJxvKiN
        Connected
        dealName (host_id: 12D3KooWFS4WXar3f1SWCykTUy9cVKNU8x1yDA18ZYp86mXTUyAe, worker_id: 12D3KooWT1v3MHQWNqVdRPtK7ntozb3JegdPo9cfM3tXkNAE3CYp, spell_id: 782d9ff1-a243-4447-a6b6-51a4f40966e1):
        
        2024-02-19 12:43:33 Created object: {"counter":0,"name":"test"}
        2024-02-19 12:44:33 Got:  {"counter":0,"name":"test"}
        2024-02-19 12:45:34 Got:  {"counter":1,"name":"test"}
        2024-02-19 12:46:34 Got:  {"counter":2,"name":"test"}
        2024-02-19 12:47:34 Got:  {"counter":3,"name":"test"}
        2024-02-19 12:48:34 Got:  {"counter":4,"name":"test"}
        ```
