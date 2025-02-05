using Microsoft.AspNetCore.Mvc;

using BondPrototype.Models;
using Microsoft.Extensions.Logging;
using BondPrototype.Controllers;
using TestingBond.Controllers;
namespace GeneratedControllers;

[ApiController]
[Route("[controller]/[action]")]
public class QueryController : QueryImplementations
{
    
    public QueryController(Entities db, ILogger<MovieApiController> logger) : base(db, logger)
    {
    }


	[HttpGet]
    public override IQueryable<GetMovieListDetailsType> GetMovieListDetails() => base.GetMovieListDetails();


	[HttpGet]
    public override IQueryable<GetShortProfilesOfActorsType> GetShortProfilesOfActors() => base.GetShortProfilesOfActors();


	[HttpGet]
    public override IQueryable<GetListOfActorNamesType> GetListOfActorNames() => base.GetListOfActorNames();


	[HttpGet]
    public override GetBiographyType GetBiography(decimal actorId) => base.GetBiography(actorId);


	[HttpGet]
    public override GetBiography2Type GetBiography2(decimal actorId) => base.GetBiography2(actorId);


	[HttpGet]
    public override GetShortProfileAndWorkStatsType GetShortProfileAndWorkStats(decimal actorId) => base.GetShortProfileAndWorkStats(actorId);


	[HttpGet]
    public override IQueryable<TestExecutionRulesType> TestExecutionRules() => base.TestExecutionRules();


	[HttpGet]
    public override IQueryable<PersonResult> MyCustomQuery() => base.MyCustomQuery();


	[HttpGet]
    public override IQueryable<PersonResult> AnotherCustomQuery() => base.AnotherCustomQuery();


	[HttpGet]
    public override IEnumerable<MovieResult> AnotherOne(decimal year) => base.AnotherOne(year);


	[HttpGet]
    public override IEnumerable<MyQueryType> MyQuery() => base.MyQuery();


	[HttpGet]
    public override IEnumerable<MyQuery2Type> MyQuery2() => base.MyQuery2();


	[HttpGet]
    public override IEnumerable<MyQuery3Type> MyQuery3() => base.MyQuery3();


}
